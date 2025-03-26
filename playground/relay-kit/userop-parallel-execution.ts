import * as dotenv from 'dotenv'
import { encodeNonce, Safe4337Pack } from '@safe-global/relay-kit'
import { Address } from '@safe-global/types-kit'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

dotenv.config({ path: './playground/relay-kit/.env' })

// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  PRIVATE_KEY,
  SAFE_ADDRESS = '0x',
  RPC_URL = '',
  CHAIN_ID = '',
  BUNDLER_URL = ''
} = process.env

// PIM test token contract address
// faucet: https://dashboard.pimlico.io/test-erc20-faucet
const pimlicoTokenAddress = '0xFC3e86566895Fb007c6A0d3809eb2827DF94F751'

const NUMBER_OF_OPERATIONS = 2

async function main() {
  // 1) Initialize pack
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    safeModulesVersion: '0.3.0', // Blank or 0.3.0 for Entrypoint v0.7, 0.2.0 for Entrypoint v0.6
    options: {
      safeAddress: SAFE_ADDRESS as Address
    }
  })

  // 2) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    // nativeTokenAmount: parseEther('0.05'), // Increase this value when is not enough to cover the gas fees
    erc20TokenAmount: 200_000n,
    erc20TokenContractAddress: pimlicoTokenAddress
  })

  // 3) Create Multiple SafeOperations
  const safeOperations = []

  for (let i = 0; i < NUMBER_OF_OPERATIONS; i++) {
    safeOperations.push(
      safe4337Pack.createTransaction({
        transactions,
        options: {
          validAfter: Number(timestamp - 60_000n),
          validUntil: Number(timestamp + 60_000n),
          customNonce: encodeNonce({
            key: BigInt(Date.now()) + BigInt(i), // Ensure unique nonce
            sequence: 0n
          })
        }
      })
    )
  }

  const createdSafeOperations = await Promise.all(safeOperations)

  // 4) Sign all SafeOperations
  const signingPromises = createdSafeOperations.map((op) => safe4337Pack.signSafeOperation(op))
  const signedOperations = await Promise.all(signingPromises)

  // Log all operations
  signedOperations.forEach((op, index) => console.log(`SafeOperation ${index + 1}`, op))

  // 5) Execute all operations in parallel
  const executionPromises = signedOperations.map((op) =>
    safe4337Pack.executeTransaction({ executable: op })
  )

  const userOperationHashes = await Promise.all(executionPromises)

  // Wait for all operations to complete
  await Promise.all(
    userOperationHashes.map((hash) => waitForOperationToFinish(hash, CHAIN_ID, safe4337Pack))
  )
}

main()
