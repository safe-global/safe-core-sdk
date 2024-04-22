import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

// This file can be used to play around with the Safe Core SDK

interface Config {
  CHAIN_ID: bigint
  RPC_URL: string
  SIGNER_ADDRESS_PRIVATE_KEY: string
  SAFE_ADDRESS: string
}

const config: Config = {
  CHAIN_ID: 11155111n,
  RPC_URL: 'https://rpc.ankr.com/eth_sepolia',
  SIGNER_ADDRESS_PRIVATE_KEY: '<SIGNER_ADDRESS_PRIVATE_KEY>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>'
}

async function main() {
  // Create Safe instance
  const safe = await Safe.create({
    provider: config.RPC_URL,
    signer: config.SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: config.SAFE_ADDRESS
  })

  // Create Safe API Kit instance
  const service = new SafeApiKit({
    chainId: config.CHAIN_ID
  })

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    to: '0x',
    value: '1', // 1 wei
    data: '0x',
    operation: OperationType.Call
  }
  const safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] })

  const senderAddress = (await safe.getSafeProvider().getSignerAddress()) || '0x'
  const safeTxHash = await safe.getTransactionHash(safeTransaction)
  const signature = await safe.signHash(safeTxHash)

  // Propose transaction to the service
  await service.proposeTransaction({
    safeAddress: config.SAFE_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress,
    senderSignature: signature.data
  })

  console.log('Proposed a transaction with Safe:', config.SAFE_ADDRESS)
  console.log('- safeTxHash:', safeTxHash)
  console.log('- Sender:', senderAddress)
  console.log('- Sender signature:', signature.data)
}

main()
