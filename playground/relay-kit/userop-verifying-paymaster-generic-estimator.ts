import * as dotenv from 'dotenv'
import { Safe4337Pack, GenericFeeEstimator } from '@safe-global/relay-kit'
import { waitForOperationToFinish } from '../utils'

dotenv.config({ path: './playground/relay-kit/.env' })

// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  PRIVATE_KEY,
  SAFE_ADDRESS = '0x',
  RPC_URL = '',
  CHAIN_ID = '',
  BUNDLER_URL = '',
  PAYMASTER_URL = '',
  POLICY_ID
} = process.env

async function main() {
  // 1) Initialize pack with the paymaster data
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    safeModulesVersion: '0.3.0', // Blank or 0.3.0 for Entrypoint v0.7, 0.2.0 for Entrypoint v0.6
    bundlerUrl: BUNDLER_URL,
    paymasterOptions: {
      isSponsored: true,
      paymasterUrl: PAYMASTER_URL,
      sponsorshipPolicyId: POLICY_ID
    },
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // 2) Create SafeOperation
  const safeOperation = await safe4337Pack.createTransaction({
    transactions:[{
      to: '0xfaDDcFd59924F559AC24350C4b9dA44b57E62857',
      value: '0x0',
      data: '0x'
    }],
    options: {
      feeEstimator: new GenericFeeEstimator(
          RPC_URL,
          CHAIN_ID,
          1.1 //fee multiplier, defaults to 1.5
      )
    }
  })

  // 3) Sign SafeOperation
  const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

  console.log('SafeOperation', signedSafeOperation)

  // 4) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: signedSafeOperation
  })

  await waitForOperationToFinish(userOperationHash, CHAIN_ID, safe4337Pack)
}

main()
