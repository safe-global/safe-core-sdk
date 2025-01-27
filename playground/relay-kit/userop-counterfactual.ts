import * as dotenv from 'dotenv'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { parseEther } from 'viem'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

dotenv.config({ path: './playground/relay-kit/.env' })

const {
  PRIVATE_KEY,
  OWNER_ADDRESS = '0x',
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
    options: {
      owners: [OWNER_ADDRESS],
      threshold: 1,
      saltNonce: '4337' + '100'
    }
  })

  // 2) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    nativeTokenAmount: parseEther('0.1'),
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
