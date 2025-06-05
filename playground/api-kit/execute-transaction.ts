import * as dotenv from 'dotenv'
import { Hash } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

dotenv.config({ path: './playground/api-kit/.env' })
// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  CHAIN_ID = 11155111,
  RPC_URL = '',
  API_KEY = '',
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
    apiKey: API_KEY || ''
  })

  // Get the transaction
  const safeTransaction = await apiKit.getTransaction(SAFE_TX_HASH)
  const isTxExecutable = await protocolKit.isValidTransaction(safeTransaction)

  if (isTxExecutable) {
    // Execute the transaction
    const txResponse = await protocolKit.executeTransaction(safeTransaction)

    await waitForTransactionReceipt(protocolKit.getSafeProvider().getExternalProvider(), {
      hash: txResponse.hash as Hash
    })

    console.log('Transaction executed.')
    console.log('- Transaction hash:', txResponse.hash)
  } else {
    console.log('Transaction invalid. Transaction was not executed.')
  }
}

main()
