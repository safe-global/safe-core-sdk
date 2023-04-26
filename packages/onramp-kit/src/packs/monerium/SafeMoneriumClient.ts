import { ethers } from 'ethers'
import { Chain, IBAN, MoneriumClient, Network, NewOrder, OrderKind } from '@monerium/sdk'

import Safe, { getSignMessageLibContract } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { EthAdapter, OperationType } from '@safe-global/safe-core-sdk-types'

import {
  EIP_1271_BYTES_INTERFACE,
  EIP_1271_INTERFACE,
  MAGIC_VALUE,
  MAGIC_VALUE_BYTES
} from './signatures'
import { SafeMoneriumOrder } from './types'

export class SafeMoneriumClient extends MoneriumClient {
  #safeSdk: Safe
  #ethAdapter: EthAdapter

  /**
   * Constructor where the Monerium environment and the Protocol kit instance are set
   * @param environment The Monerium environment
   * @param safeSdk The Protocol kit instance
   */
  constructor(environment: 'production' | 'sandbox', safeSdk: Safe) {
    super(environment)

    this.#safeSdk = safeSdk
    this.#ethAdapter = safeSdk.getEthAdapter()
  }

  /**
   * We get the Safe address using the Protocol kit instance
   * @returns The Safe address
   */
  async getSafeAddress(): Promise<string> {
    return this.#safeSdk.getAddress()
  }

  /**
   * Allow to make transactions using the Monerium SDK
   * @param order The order to be placed
   */
  async send(order: SafeMoneriumOrder) {
    const newOrder = await this.#createOrder(order)

    try {
      // Place the order to Monerium and Safe systems for being related and confirmed
      await this.placeOrder(newOrder)
      await this.signMessage(order.safeAddress, newOrder.message)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * Check if the message is signed in the smart contract
   * @param safeAddress The Safe address
   * @param message The message to be signed
   * @returns A boolean indicating if the message is signed
   */
  async isMessageSigned(safeAddress: string, message: string): Promise<boolean> {
    const messageHash = ethers.utils.hashMessage(message)
    const messageHashSigned = await this.#isValidSignature(safeAddress, messageHash)
    return messageHashSigned
  }

  /**
   * Check if the message is pending (multi owner or not executed) using the Transaction Service
   * @param safeAddress The Safe address
   * @param message The message to be signed
   * @returns A boolean indicating if the message is signed
   */
  async isSignMessagePending(safeAddress: string, message: string): Promise<boolean> {
    const apiKit = new SafeApiKit({
      txServiceUrl: await this.getTransactionServiceUrl(),
      ethAdapter: this.#ethAdapter
    })

    const pendingTransactions = await apiKit.getPendingTransactions(safeAddress)

    const isMessagePending = pendingTransactions.results.some((tx) => {
      if (
        // @ts-expect-error - dataDecoded should have the method property
        tx?.dataDecoded?.method === 'signMessage' &&
        // @ts-expect-error - dataDecoded should have the parameters array
        tx?.dataDecoded?.parameters[0]?.value === ethers.utils.hashMessage(message)
      ) {
        return true
      }

      return false
    })

    return isMessagePending
  }

  /**
   * Sign a message using the Safe SDK
   * @param safeAddress The Safe address
   * @param message The message to be signed
   */
  async signMessage(safeAddress: string, message: string) {
    try {
      const safeVersion = await this.#safeSdk.getContractVersion()

      const signMessageContract = await getSignMessageLibContract({
        ethAdapter: this.#ethAdapter,
        safeVersion
      })

      const txData = signMessageContract.encode('signMessage', [ethers.utils.hashMessage(message)])

      const safeTransaction = await this.#safeSdk.createTransaction({
        safeTransactionData: {
          to: signMessageContract.getAddress(),
          value: '0',
          data: txData,
          operation: OperationType.DelegateCall
        }
      })

      const safeTxHash = await this.#safeSdk.getTransactionHash(safeTransaction)

      const senderSignature = await this.#safeSdk.signTransactionHash(safeTxHash)

      const apiKit = new SafeApiKit({
        txServiceUrl: await this.getTransactionServiceUrl(),
        ethAdapter: this.#ethAdapter
      })

      await apiKit.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: (await this.#ethAdapter.getSignerAddress()) || '',
        senderSignature: senderSignature.data
      })

      const transaction = await apiKit.getTransaction(safeTxHash)

      // With 1/1 Safes we can execute the transaction right away
      if (transaction.confirmations?.length === transaction.confirmationsRequired) {
        await this.#safeSdk.executeTransaction(transaction)
      }
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * Get the corresponding Monerium SDK Chain from the current chain id
   * @returns The Chain
   */
  async getChain() {
    const chainId = await this.#safeSdk.getChainId()

    switch (chainId) {
      case 1:
      case 5:
        return Chain.ethereum
      case 100:
      case 10200:
        return Chain.gnosis
      case 137:
      case 80001:
        return Chain.polygon
      default:
        throw new Error(`Chain not supported: ${chainId}`)
    }
  }

  /**
   * Get the corresponding Monerium SDK Network from the current chain id
   * @returns The Network
   */
  async getNetwork() {
    const chainId = await this.#safeSdk.getChainId()

    switch (chainId) {
      case 1:
      case 100:
      case 137:
        return Network.mainnet
      case 5:
        return Network.goerli
      case 10200:
        return Network.chiado
      case 80001:
        return Network.mumbai
      default:
        throw new Error(`Network not supported: ${chainId}`)
    }
  }

  /**
   * Get the corresponding transaction service url from the current chain id
   * @returns The Transaction Service URL
   */
  async getTransactionServiceUrl() {
    const chainId = await this.#safeSdk.getChainId()

    switch (chainId) {
      case 1:
        return 'https://safe-transaction-mainnet.safe.global'
      case 5:
        return 'https://safe-transaction-goerli.safe.global'
      case 100:
        return 'https://safe-transaction-gnosis.safe.global'
      case 137:
        return 'https://safe-transaction-polygon.safe.global'
      default:
        throw new Error(`Chain not supported: ${chainId}`)
    }
  }

  /**
   * Check if the message signature is valid using the fallback handler Smart Contract
   * @param safeAddress The Safe address
   * @param messageHash The message hash
   * @returns A boolean indicating if the message is signed
   */
  async #isValidSignature(safeAddress: string, messageHash: string): Promise<boolean> {
    try {
      const eip1271data = EIP_1271_INTERFACE.encodeFunctionData('isValidSignature', [
        messageHash,
        '0x'
      ])
      const msgBytes = ethers.utils.arrayify(messageHash)

      const eip1271BytesData = EIP_1271_BYTES_INTERFACE.encodeFunctionData('isValidSignature', [
        msgBytes,
        '0x'
      ])

      const checks = [
        this.#ethAdapter.call({
          from: safeAddress,
          to: safeAddress,
          data: eip1271data
        }),
        this.#ethAdapter.call({
          from: safeAddress,
          to: safeAddress,
          data: eip1271BytesData
        })
      ]

      const response = await Promise.all(checks)

      return (
        !!response.length &&
        (response[0].slice(0, 10).toLowerCase() === MAGIC_VALUE ||
          response[1].slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES)
      )
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * Create a valid order for the Monerium SDK
   * @param order The order to be created
   * @returns The Monerium type order
   */
  async #createOrder(order: SafeMoneriumOrder): Promise<Promise<Promise<NewOrder>>> {
    return {
      kind: OrderKind.redeem,
      amount: order.amount,
      signature: '0x',
      address: order.safeAddress,
      currency: order.currency,
      counterpart: order.counterpart,
      memo: order.memo,
      message: this.#getSendMessage(order),
      chain: await this.getChain(),
      network: await this.getNetwork(),
      supportingDocumentId: ''
    }
  }

  /**
   * Format a valid message to be signed for executing a transaction
   * @param order The order : ;
   * @returns The message to be signed
   */
  #getSendMessage(order: SafeMoneriumOrder) {
    const currentDate = new Date().toISOString()

    return `Send ${order.currency.toUpperCase()} ${order.amount} to ${
      (order.counterpart.identifier as IBAN).iban
    } at ${currentDate}`
  }
}
