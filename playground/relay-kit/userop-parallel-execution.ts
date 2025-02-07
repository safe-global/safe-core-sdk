import * as dotenv from 'dotenv'
import { encodeNonce, Safe4337Pack } from '@safe-global/relay-kit'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

dotenv.config({ path: './playground/relay-kit/.env' })

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

async function main() {
  // 1) Initialize pack
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    safeModulesVersion: '0.3.0', // Blank or 0.3.0 for Entrypoint v0.7, 0.2.0 for Entrypoint v0.6
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // 2) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    // nativeTokenAmount: parseEther('0.05'), // Increase this value when is not enough to cover the gas fees
    erc20TokenAmount: 200_000n,
    erc20TokenContractAddress: pimlicoTokenAddress
  })

  // 3) Create SafeOperation
  const safeOperation1 = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: Number(timestamp - 60_000n),
      validUntil: Number(timestamp + 60_000n),
      customNonce: encodeNonce({ key: BigInt(Date.now()), sequence: 0n }) // Custom nonce to avoid nonce collision
    }
  })

  const safeOperation2 = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: Number(timestamp - 60_000n),
      validUntil: Number(timestamp + 60_000n),
      customNonce: encodeNonce({ key: BigInt(Date.now()), sequence: 0n }) // Custom nonce to avoid nonce collision
    }
  })

  // 4) Sign SafeOperation
  const signedSafeOperation1 = await safe4337Pack.signSafeOperation(safeOperation1)
  const signedSafeOperation2 = await safe4337Pack.signSafeOperation(safeOperation2)

  console.log('SafeOperation 1', signedSafeOperation1)
  console.log('SafeOperation 2', signedSafeOperation2)

  // 5) Execute SafeOperation
  const [userOperationHash1, userOperationHash2] = await Promise.all([
    safe4337Pack.executeTransaction({
      executable: signedSafeOperation1
    }),
    safe4337Pack.executeTransaction({
      executable: signedSafeOperation2
    })
  ])

  await Promise.all([
    waitForOperationToFinish(userOperationHash1, CHAIN_ID, safe4337Pack),
    waitForOperationToFinish(userOperationHash2, CHAIN_ID, safe4337Pack)
  ])
}

main()
