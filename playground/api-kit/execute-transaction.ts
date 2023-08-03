import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
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
  TX_SERVICE_URL: 'https://safe-transaction-goerli.safe.global/', // Check https://docs.safe.global/safe-core-api/available-services
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

  // Create Safe API Kit instance
  const service = new SafeApiKit({
    txServiceUrl: config.TX_SERVICE_URL,
    ethAdapter
  })

  // Get the transaction
  const safeTransaction = await service.getTransaction(config.SAFE_TX_HASH)

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
