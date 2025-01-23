import { Safe4337Pack } from '@safe-global/relay-kit'
import { parseEther } from 'viem'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

// Safe owner PK
const PRIVATE_KEY = ''

// Pimlico API key
const PIMLICO_API_KEY = ''

// Safe owner address
const OWNER_ADDRESS = ''

// RPC URL
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com' // SEPOLIA

// CHAIN
const CHAIN_NAME = '11155111'

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v2/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

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

  // 1) Setup Playground
  const { transactions, timestamp } = await setup4337Playground(safe4337Pack, {
    nativeTokenAmount: parseEther('0.1'),
    erc20TokenAmount: 200_000n,
    erc20TokenContractAddress: pimlicoTokenAddress
  })

  // 2) Create transaction batch
  const safeOperation = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: Number(timestamp - 60_000n),
      validUntil: Number(timestamp + 60_000n)
    }
  })

  // 3) Sign SafeOperation
  const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

  console.log('SafeOperation', signedSafeOperation)

  // 4) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: signedSafeOperation
  })

  await waitForOperationToFinish(userOperationHash, CHAIN_NAME, safe4337Pack)
}

main()
