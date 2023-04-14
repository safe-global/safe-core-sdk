import Safe, {
  EthersAdapter,
  getCompatibilityFallbackHandlerContract,
  getSignMessageLibContract
} from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import {
  Chain,
  Counterpart,
  Currency,
  IBAN,
  MoneriumClient,
  Network,
  OrderKind
} from '@monerium/sdk'
import { EIP_1271_INTERFACE, MAGIC_VALUE } from './signatures'

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
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    const safeOwner = provider.getSigner(0)

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: safeOwner
    })

    const safeSdk = await Safe.create({ ethAdapter, safeAddress, isL1SafeMasterCopy: true })
    const safeVersion = await safeSdk.getContractVersion()

    const signMessageContract = await getSignMessageLibContract({
      ethAdapter,
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
      ethAdapter
    })

    await apiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: await safeOwner.getAddress(),
      senderSignature: senderSignature.data
    })

    const transaction = await apiKit.getTransaction(safeTxHash)

    if (transaction.confirmations?.length === transaction.confirmationsRequired) {
      const executeTxResponse = await safeSdk.executeTransaction(transaction)
      // This stops showing the Monerium UI so should be avoided
      // const receipt = await executeTxResponse.transactionResponse?.wait()
      // console.log(receipt)
    }
  }

  async isValidSignature(safeAddress: string, message: string, chainId: number) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    const safeOwner = provider.getSigner(0)

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: safeOwner
    })

    const safeSdk = await Safe.create({
      ethAdapter,
      safeAddress,
      isL1SafeMasterCopy: true
    })
    const safeVersion = await safeSdk.getContractVersion()

    const fallbackHandler = await getCompatibilityFallbackHandlerContract({
      ethAdapter,
      safeVersion,
      chainId
    })

    // We should add signature validation for legacy contracts
    const txData = EIP_1271_INTERFACE.encodeFunctionData('isValidSignature', [
      ethers.utils.hashMessage(message),
      '0x'
    ])

    const response = await ethAdapter.call({
      from: safeAddress,
      to: fallbackHandler.getAddress(),
      data: txData
    })

    return response.slice(0, 10).toLowerCase() === MAGIC_VALUE
  }
}
