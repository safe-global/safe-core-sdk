import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

// This file can be used to play around with the Safe Core SDK

interface Config {
  CHAIN_ID: bigint
  RPC_URL: string
  SIGNER_ADDRESS_PRIVATE_KEY: string
  SAFE_ADDRESS: string
  SAFE_TX_HASH: string
}

const config: Config = {
  CHAIN_ID: 11155111n,
  RPC_URL: 'https://sepolia.gateway.tenderly.co',
  SIGNER_ADDRESS_PRIVATE_KEY: '<SIGNER_ADDRESS_PRIVATE_KEY>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>',
  SAFE_TX_HASH: '<SAFE_TX_HASH>'
}

async function main() {
  // Create Safe instance
  const protocolKit = await Safe.init({
    provider: config.RPC_URL,
    signer: config.SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: config.SAFE_ADDRESS
  })

  // Create Safe API Kit instance
  const apiKit = new SafeApiKit({
    chainId: config.CHAIN_ID
  })

  // Get the transaction
  const safeTransaction = await apiKit.getTransaction(config.SAFE_TX_HASH)
  const safeTxHash = safeTransaction.safeTxHash
  const signature = await protocolKit.signHash(safeTxHash)

  // Confirm the Safe transaction
  const signatureResponse = await apiKit.confirmTransaction(safeTxHash, signature.data)

  const signerAddress = await protocolKit.getSafeProvider().getSignerAddress()
  console.log('Added a new signature to transaction with safeTxGas:', config.SAFE_TX_HASH)
  console.log('- Signer:', signerAddress)
  console.log('- Signer signature:', signatureResponse.signature)
}

main()
