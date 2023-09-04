import { hashMessage } from '@ethersproject/hash'
import { arrayify } from '@ethersproject/bytes'
import { Chain, IBAN, MoneriumClient, Networks, NewOrder, OrderKind } from '@monerium/sdk'
import Safe, { getSignMessageLibContract } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import {
  EthAdapter,
  OperationType,
  SafeMultisigTransactionResponse
} from '@safe-global/safe-core-sdk-types'

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
  async send(order: SafeMoneriumOrder): Promise<SafeMultisigTransactionResponse> {
    const safeAddress = await this.getSafeAddress()
    const newOrder = await this.#createOrder(safeAddress, order)

    try {
      // Place the order to Monerium and Safe systems for being linked between each other and confirmed
      await this.placeOrder(newOrder)

      const safeTransaction = await this.signMessage(safeAddress, newOrder.message)

      return safeTransaction
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
    const messageHash = hashMessage(message)
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

    return pendingTransactions.results.some((tx) => {
      return (
        // @ts-expect-error - dataDecoded should have the method property
        tx?.dataDecoded?.method === 'signMessage' &&
        // @ts-expect-error - dataDecoded should have the parameters array
        tx?.dataDecoded?.parameters[0]?.value === hashMessage(message)
      )
    })
  }

  /**
   * Sign a message using the Safe SDK
   * @param safeAddress The Safe address
   * @param message The message to be signed
   */
  async signMessage(
    safeAddress: string,
    message: string
  ): Promise<SafeMultisigTransactionResponse> {
    try {
      const safeVersion = await this.#safeSdk.getContractVersion()

      const signMessageContract = await getSignMessageLibContract({
        ethAdapter: this.#ethAdapter,
        safeVersion
      })

      const txData = signMessageContract.encode('signMessage', [hashMessage(message)])

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

      return transaction
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * Get the corresponding Monerium SDK Chain from the current chain id
   * @returns The Chain
   */
  async getChain(): Promise<Chain> {
    const chainId = await this.#safeSdk.getChainId()

    switch (chainId) {
      case 1:
      case 5:
        return 'ethereum'
      case 100:
      case 10200:
        return 'gnosis'
      case 137:
      case 80001:
        return 'polygon'
      default:
        throw new Error(`Chain not supported: ${chainId}`)
    }
  }

  /**
   * Get the corresponding Monerium SDK Network from the current chain id
   * @returns The Network
   */
  async getNetwork(): Promise<Networks> {
    const chainId = await this.#safeSdk.getChainId()

    switch (chainId) {
      case 1:
      case 100:
      case 137:
        return 'mainnet'
      case 5:
        return 'goerli'
      case 10200:
        return 'chiado'
      case 80001:
        return 'mumbai'
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
      const msgBytes = arrayify(messageHash)

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
  async #createOrder(safeAddress: string, order: SafeMoneriumOrder): Promise<NewOrder> {
    return {
      kind: OrderKind.redeem,
      amount: order.amount,
      signature: '0x',
      address: safeAddress,
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
   * @param order The created order
   * @returns The message to be signed containing the order details
   */
  #getSendMessage(order: SafeMoneriumOrder): string {
    const currentDate = new Date().toISOString()

    return `Send ${order.currency.toUpperCase()} ${order.amount} to ${
      (order.counterpart.identifier as IBAN).iban
    } at ${currentDate}`
  }
}
