import { Chain } from 'viem'
import { sepolia } from 'viem/chains'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

// This file can be used to play around with the Safe Core SDK

interface Config {
  CHAIN: Chain
  SIGNER_ADDRESS_PRIVATE_KEY: string
  SAFE_ADDRESS: string
}

const config: Config = {
  CHAIN: sepolia,
  SIGNER_ADDRESS_PRIVATE_KEY: '<SIGNER_ADDRESS_PRIVATE_KEY>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>'
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

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    to: config.SAFE_ADDRESS,
    value: '1', // 1 wei
    data: '0x',
    operation: OperationType.Call
  }
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [safeTransactionData]
  })

  const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
  const signature = await protocolKit.signHash(safeTxHash)

  // Propose transaction to the service
  await apiKit.proposeTransaction({
    safeAddress: config.SAFE_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: signature.data
  })

  console.log('Proposed a transaction with Safe:', config.SAFE_ADDRESS)
  console.log('- safeTxHash:', safeTxHash)
  console.log('- Sender:', signerAddress)
  console.log('- Sender signature:', signature.data)
}

main()
