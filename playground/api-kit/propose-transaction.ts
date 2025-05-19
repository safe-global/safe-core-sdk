import * as dotenv from 'dotenv'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/types-kit'

dotenv.config({ path: './playground/api-kit/.env' })
// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  CHAIN_ID = 11155111,
  RPC_URL = '',
  TX_SERVICE_API_KEY = '',
  SIGNER_ADDRESS_PRIVATE_KEY = '',
  SAFE_ADDRESS = ''
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
    txServiceApiKey: TX_SERVICE_API_KEY || ''
  })

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    to: SAFE_ADDRESS,
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
    safeAddress: SAFE_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: signature.data
  })

  console.log('Proposed a transaction with Safe:', SAFE_ADDRESS)
  console.log('- safeTxHash:', safeTxHash)
  console.log('- Sender:', signerAddress)
  console.log('- Sender signature:', signature.data)
}

main()
