import { Safe4337Pack } from '@safe-global/relay-kit'
import { waitForOperationToFinish, setup4337Playground } from '../utils'

// Safe owner PK
const PRIVATE_KEY = ''

const PIMLICO_API_KEY = ''

// Safe 4337 compatible
const SAFE_ADDRESS = ''

// CHAIN
const CHAIN_NAME = '11155111'

// RPC URL
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com' // SEPOLIA
// const RPC_URL = 'https://rpc.gnosischain.com/' // GNOSIS

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v2/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// PAYMASTER ADDRESSES
const paymasterAddress_v07 = '0x0000000000000039cd5e8ae05257ce51c473ddd1'
const paymasterAddress_v06 = '0x00000000000000fb866daaa79352cc568a005d96'

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

  await waitForOperationToFinish(userOperationHash, CHAIN_NAME, safe4337Pack)
}

main()
