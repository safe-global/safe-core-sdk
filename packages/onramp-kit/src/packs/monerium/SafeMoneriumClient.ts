import Safe, { EthersAdapter, getSignMessageLibContract } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { MoneriumClient } from '@monerium/sdk'

export class SafeMoneriumClient extends MoneriumClient {
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
      const receipt = await executeTxResponse.transactionResponse?.wait()
      console.log(receipt)
    }
  }
}
