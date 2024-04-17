import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

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
  const provider = new ethers.JsonRpcProvider(config.RPC_URL)
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

  const senderAddress = await signer.getAddress()
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
