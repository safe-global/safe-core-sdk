import * as dotenv from 'dotenv'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

dotenv.config({ path: './playground/api-kit/.env' })
// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  CHAIN_ID = 11155111,
  RPC_URL = '',
  TX_SERVICE_API_KEY = '',
  SIGNER_ADDRESS_PRIVATE_KEY = '',
  SAFE_ADDRESS = '',
  SAFE_TX_HASH = ''
} = process.env

async function main() {
  // Create Safe instance
  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS
  })

  // Create Safe API Kit instance
  const apiKit = new SafeApiKit({
    chainId: BigInt(CHAIN_ID),
    txServiceApiKey: TX_SERVICE_API_KEY
  })

  // Get the transaction
  const safeTransaction = await apiKit.getTransaction(SAFE_TX_HASH || '')
  const safeTxHash = safeTransaction.safeTxHash
  const signature = await protocolKit.signHash(safeTxHash)

  // Confirm the Safe transaction
  const signatureResponse = await apiKit.confirmTransaction(safeTxHash, signature.data)

  const signerAddress = await protocolKit.getSafeProvider().getSignerAddress()
  console.log('Added a new signature to transaction with safeTxGas:', SAFE_TX_HASH)
  console.log('- Signer:', signerAddress)
  console.log('- Signer signature:', signatureResponse.signature)
}

main()
