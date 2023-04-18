import Safe, { getSignMessageLibContract } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers'
import { EthAdapter, OperationType } from '@safe-global/safe-core-sdk-types'
import {
  Chain,
  Counterpart,
  Currency,
  IBAN,
  MoneriumClient,
  Network,
  OrderKind
} from '@monerium/sdk'
import {
  EIP_1271_BYTES_INTERFACE,
  EIP_1271_INTERFACE,
  MAGIC_VALUE,
  MAGIC_VALUE_BYTES
} from './signatures'
import { MoneriumInitOptions } from './types'

type SafeMoneriumOrder = {
  safeAddress: string
  amount: string
  currency: Currency
  counterpart: Counterpart // Beneficiary
  network: Network
  chain: Chain
  memo: string
}

export class SafeMoneriumClient extends MoneriumClient {
  #ethAdapter: EthAdapter

  constructor(environment: 'production' | 'sandbox', options: MoneriumInitOptions) {
    super(environment)

    this.#ethAdapter = options.ethAdapter
  }

  async send(order: SafeMoneriumOrder) {
    const date = new Date().toISOString()
    const messageToSign = `Send ${order.currency.toUpperCase()} ${order.amount} to ${
      (order.counterpart.identifier as IBAN).iban
    } at ${date}`

    const newOrder = {
      kind: OrderKind.redeem,
      amount: order.amount,
      signature: '0x',
      address: order.safeAddress,
      currency: order.currency,
      counterpart: order.counterpart,
      memo: order.memo,
      message: messageToSign,
      chain: Chain.ethereum,
      network: Network.goerli,
      supportingDocumentId: ''
    }

    const moneriumOrderReponse = await this.placeOrder(newOrder)
    const safeSignResponse = await this.signMessage(order.safeAddress, messageToSign, 5)

    console.log(moneriumOrderReponse, safeSignResponse)
  }

  async signMessage(safeAddress: string, message: string, chainId: number) {
    const safeSdk = await Safe.create({
      ethAdapter: this.#ethAdapter,
      safeAddress,
      isL1SafeMasterCopy: true
    })
    const safeVersion = await safeSdk.getContractVersion()

    const signMessageContract = await getSignMessageLibContract({
      ethAdapter: this.#ethAdapter,
      safeVersion,
      chainId
    })

    const txData = signMessageContract.encode('signMessage', [ethers.utils.hashMessage(message)])

    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData: {
        to: signMessageContract.getAddress(),
        value: '0',
        data: txData,
        operation: OperationType.DelegateCall
      }
    })

    console.log(safeTransaction)

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)

    // Sign transaction to verify that the transaction is coming from owner 1
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash)

    const apiKit = new SafeApiKit({
      txServiceUrl: 'https://safe-transaction-goerli.safe.global',
      ethAdapter: this.#ethAdapter
    })

    await apiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: (await this.#ethAdapter.getSignerAddress()) || '',
      senderSignature: senderSignature.data
    })

    // TODO: Remove as This stops showing the Monerium UI so should be avoided
    // const transaction = await apiKit.getTransaction(safeTxHash)

    // if (transaction.confirmations?.length === transaction.confirmationsRequired) {
    //   const executeTxResponse = await safeSdk.executeTransaction(transaction)
    //   const receipt = await executeTxResponse.transactionResponse?.wait()
    //   console.log(receipt)
    // }
  }

  async isMessageSigned(safeAddress: string, message: string): Promise<boolean> {
    const messageHash = ethers.utils.hashMessage(message)
    const messageHashSigned = await this.#isMessageHashSigned(safeAddress, messageHash)
    return messageHashSigned
  }

  async #isMessageHashSigned(safeAddress: string, messageHash: string): Promise<boolean> {
    const txData1 = EIP_1271_INTERFACE.encodeFunctionData('isValidSignature', [messageHash, '0x'])

    const response1 = await this.#ethAdapter.call({
      from: safeAddress,
      to: safeAddress,
      data: txData1
    })

    const msgBytes = ethers.utils.arrayify(messageHash)

    const txData2 = EIP_1271_BYTES_INTERFACE.encodeFunctionData('isValidSignature', [
      msgBytes,
      '0x'
    ])

    const response2 = await this.#ethAdapter.call({
      from: safeAddress,
      to: safeAddress,
      data: txData2
    })

    return (
      response1.slice(0, 10).toLowerCase() === MAGIC_VALUE ||
      response2.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES
    )
  }
}
