import { getBlock } from 'viem/actions'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { generateTransferCallData, waitForOperationToFinish } from '../utils'

// Safe owner PK
const PRIVATE_KEY = ''

const PIMLICO_API_KEY = ''

// Safe 4337 compatible
const SAFE_ADDRESS = ''

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// RPC URL
const RPC_URL = 'https://rpc.sepolia.org'

const CHAIN_NAME = 'sepolia'

// USDC CONTRACT ADDRESS IN SEPOLIA
// faucet: https://faucet.circle.com/
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

async function main() {
  // 1) Initialize pack
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // Log supported entry points and chain id
  console.log('Supported Entry Points', await safe4337Pack.getSupportedEntryPoints())
  console.log('Chain Id', await safe4337Pack.getChainId())

  // Create transaction batch with two 0.1 USDC transfers
  const senderAddress = await safe4337Pack.protocolKit.getAddress()

  const usdcAmount = 100_000n // 0.1 USDC

  // we transfer the USDC to the Safe Account itself
  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]
  const externalProvider = safe4337Pack.protocolKit.getSafeProvider().getExternalProvider()
  const timestamp = (await getBlock(externalProvider))?.timestamp || 0n

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
