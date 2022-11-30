import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import SafeSignature from '@safe-global/safe-core-sdk/dist/src/utils/signatures/SafeSignature'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import SafeServiceClient from '@safe-global/safe-service-client'
import { ethers } from 'ethers'

// This file can be used to play around with the Safe Core SDK

interface Config {
  RPC_URL: string
  SIGNER_ADDRESS_PRIVATE_KEY: string
  SAFE_ADDRESS: string
  TX_SERVICE_URL: string
  SAFE_TX_HASH: string
}

const config: Config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  SIGNER_ADDRESS_PRIVATE_KEY: '<SIGNER_ADDRESS_PRIVATE_KEY>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>',
  TX_SERVICE_URL: 'https://safe-transaction-goerli.safe.global/', // Check https://docs.gnosis-safe.io/backend/available-services
  SAFE_TX_HASH: '<SAFE_TX_HASH>'
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const signer = new ethers.Wallet(config.SIGNER_ADDRESS_PRIVATE_KEY, provider)

  // Create EthAdapter instance
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  })

  // Create Safe instance
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: config.SAFE_ADDRESS
  })

  // Create Safe Service Client instance
  const service = new SafeServiceClient({
    txServiceUrl: config.TX_SERVICE_URL,
    ethAdapter
  })

  // Get the transaction
  const transaction = await service.getTransaction(config.SAFE_TX_HASH)
  const safeTransactionData: SafeTransactionDataPartial = {
    to: transaction.to,
    value: transaction.value,
    data: transaction.data,
    operation: transaction.operation
    // ...
  }
  const safeTransaction = await safe.createTransaction({ safeTransactionData })
  transaction.confirmations?.map((confirmation) => {
    const signature = new SafeSignature(confirmation.owner, confirmation.signature)
    safeTransaction.addSignature(signature)
  })

  const isTxExecutable = await safe.isValidTransaction(safeTransaction)

  if (isTxExecutable) {
    // Execute the transaction
    const txResponse = await safe.executeTransaction(safeTransaction)
    const contractReceipt = await txResponse.transactionResponse?.wait()

    console.log('Transaction executed.')
    console.log('- Transaction hash:', contractReceipt?.transactionHash)
  } else {
    console.log('Transaction invalid. Transaction was not executed.')
  }
}

main()
