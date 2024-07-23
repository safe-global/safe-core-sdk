import { Chain, Hash } from 'viem'
import { sepolia } from 'viem/chains'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

// This file can be used to play around with the Safe Core SDK

interface Config {
  CHAIN: Chain
  SIGNER_ADDRESS_PRIVATE_KEY: string
  SAFE_ADDRESS: string
  SAFE_TX_HASH: string
}

const config: Config = {
  CHAIN: sepolia,
  SIGNER_ADDRESS_PRIVATE_KEY: '<SIGNER_ADDRESS_PRIVATE_KEY>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>',
  SAFE_TX_HASH: '<SAFE_TX_HASH>'
}

async function main() {
  // Create Safe instance
  const protocolKit = await Safe.init({
    provider: config.CHAIN.rpcUrls.default.http[0],
    signer: config.SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: config.SAFE_ADDRESS
  })

  // Create Safe API Kit instance
  const apiKit = new SafeApiKit({
    chainId: BigInt(config.CHAIN.id)
  })

  // Get the transaction
  const safeTransaction = await apiKit.getTransaction(config.SAFE_TX_HASH)
  const isTxExecutable = await protocolKit.isValidTransaction(safeTransaction)

  if (isTxExecutable) {
    // Execute the transaction
    const txResponse = await protocolKit.executeTransaction(safeTransaction)

    await protocolKit
      .getSafeProvider()
      .getExternalProvider()
      .waitForTransactionReceipt({ hash: txResponse.hash as Hash })

    console.log('Transaction executed.')
    console.log('- Transaction hash:', txResponse.hash)
  } else {
    console.log('Transaction invalid. Transaction was not executed.')
  }
}

main()
