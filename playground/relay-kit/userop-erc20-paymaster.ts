import * as dotenv from 'dotenv'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

dotenv.config({ path: './playground/relay-kit/.env' })

const {
  PRIVATE_KEY,
  SAFE_ADDRESS = '0x',
  RPC_URL = '',
  CHAIN_ID = '',
  BUNDLER_URL = ''
} = process.env

// PAYMASTER ADDRESSES
const paymasterAddress_v07 = '0x0000000000000039cd5e8ae05257ce51c473ddd1'
// const paymasterAddress_v06 = '0x00000000000000fb866daaa79352cc568a005d96' // Use this with the 0.2.0 safeModulesVersion that is currently compatible with the v0.6 entrypoint

// PIM test token contract address
// faucet: https://dashboard.pimlico.io/test-erc20-faucet
const pimlicoTokenAddress = '0xFC3e86566895Fb007c6A0d3809eb2827DF94F751'

async function main() {
  // 1) Initialize pack with the paymaster data
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    safeModulesVersion: '0.3.0',
    paymasterOptions: {
      paymasterUrl: BUNDLER_URL,
      paymasterTokenAddress: pimlicoTokenAddress,
      paymasterAddress: paymasterAddress_v07
    },
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // 2) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    erc20TokenAmount: 200_000n,
    erc20TokenContractAddress: pimlicoTokenAddress
  })

  // 3) Create SafeOperation
  const safeOperation = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: Number(timestamp - 60_000n),
      validUntil: Number(timestamp + 60_000n)
    }
  })

  // 4) Sign SafeOperation
  const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

  console.log('SafeOperation', signedSafeOperation)

  // 5) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: signedSafeOperation
  })

  await waitForOperationToFinish(userOperationHash, CHAIN_ID, safe4337Pack)
}

main()
