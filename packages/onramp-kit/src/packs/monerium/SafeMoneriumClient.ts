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

  constructor(environment: 'production' | 'sandbox', safeSdk: Safe) {
    super(environment)

    this.#safeSdk = safeSdk
    this.#ethAdapter = safeSdk.getEthAdapter()
  }

  async send(order: SafeMoneriumOrder) {
    const chainId = await this.#safeSdk.getChainId()
    const newOrder = this.#createOrder(order, chainId)

    try {
      // Place the order to Monerium and Safe systems for being related and confirmed
      await this.placeOrder(newOrder)
      await this.signMessage(order.safeAddress, newOrder.message)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  async signMessage(safeAddress: string, message: string) {
    try {
      const chainId = await this.#safeSdk.getChainId()

      const safeVersion = await this.#safeSdk.getContractVersion()

      const signMessageContract = await getSignMessageLibContract({
        ethAdapter: this.#ethAdapter,
        safeVersion,
        chainId
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
        txServiceUrl: this.#getTransactionServiceUrl(chainId),
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

  async isMessageSigned(safeAddress: string, message: string): Promise<boolean> {
    const messageHash = ethers.utils.hashMessage(message)
    const messageHashSigned = await this.#isMessageHashSigned(safeAddress, messageHash)
    return messageHashSigned
  }

  async #isMessageHashSigned(safeAddress: string, messageHash: string): Promise<boolean> {
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

  #createOrder(order: SafeMoneriumOrder, chainId: number): NewOrder {
    return {
      kind: OrderKind.redeem,
      amount: order.amount,
      signature: '0x',
      address: order.safeAddress,
      currency: order.currency,
      counterpart: order.counterpart,
      memo: order.memo,
      message: this.#getSendMessage(order),
      chain: this.#getChain(chainId),
      network: this.#getNetwork(chainId),
      supportingDocumentId: ''
    }
  }

  #getSendMessage(order: SafeMoneriumOrder) {
    const currentDate = new Date().toISOString()

    return `Send ${order.currency.toUpperCase()} ${order.amount} to ${
      (order.counterpart.identifier as IBAN).iban
    } at ${currentDate}`
  }

  #getChain(chainId: number) {
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

  #getNetwork(chainId: number) {
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

  #getTransactionServiceUrl(chainId: number) {
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
}
