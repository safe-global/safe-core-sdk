import dotenv from 'dotenv'
import { parseEther } from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { setup4337Playground, waitForOperationToFinish } from '../utils'

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
    safeModulesVersion: '0.3.0', // Blank or 0.3.0 for Entrypoint v0.7, 0.2.0 for Entrypoint v0.6
    bundlerUrl: BUNDLER_URL,
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // 2) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    // nativeTokenAmount: parseEther('0.01'), // Increase this value when is not enough to cover the gas fees
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
