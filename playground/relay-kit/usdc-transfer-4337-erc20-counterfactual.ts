import { Safe4337Pack } from '@safe-global/relay-kit'
import { waitForOperationToFinish, transfer, generateTransferCallData } from '../utils'

// Safe owner PK
const PRIVATE_KEY = ''

const PIMLICO_API_KEY = ''

// Safe owner address
const OWNER_ADDRESS = ''

// CHAIN
const CHAIN_NAME = 'sepolia'
// const CHAIN_NAME = 'gnosis'

// RPC URL
const RPC_URL = 'https://sepolia.gateway.tenderly.co' // SEPOLIA
// const RPC_URL = 'https://rpc.gnosischain.com/' // GNOSIS

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v1/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// PAYMASTER ADDRESS
const paymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f' // SEPOLIA
// const paymasterAddress = '0x000000000034B78bfe02Be30AE4D324c8702803d' // GNOSIS

// USDC CONTRACT ADDRESS IN SEPOLIA
// faucet: https://faucet.circle.com/
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // SEPOLIA
// const usdcTokenAddress = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83' // GNOSIS

async function main() {
  // 1) Initialize pack with the paymaster data
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    paymasterOptions: {
      paymasterTokenAddress: usdcTokenAddress,
      paymasterAddress
      // amountToApprove?: bigint // optional value to set the paymaster approve amount on the deployment
    },
    options: {
      owners: [OWNER_ADDRESS],
      threshold: 1,
      saltNonce: '4337' + '1' // to update the address
    }
  })

  // Log supported entry points and chain id
  console.log('Supported Entry Points', await safe4337Pack.getSupportedEntryPoints())
  console.log('Chain Id', await safe4337Pack.getChainId())

  // Create transaction batch with two 0.1 USDC transfers
  const senderAddress = (await safe4337Pack.protocolKit.getAddress()) as `0x${string}`

  console.log('senderAddress: ', senderAddress)

  console.log('is Safe Account deployed: ', await safe4337Pack.protocolKit.isSafeDeployed())

  const usdcAmount = 100_000n // 0.1 USDC

  console.log(`sending USDC...`)

  const ethersSigner = await safe4337Pack.protocolKit.getSafeProvider().getExternalSigner()
  const ethersProvider = safe4337Pack.protocolKit.getSafeProvider().getExternalProvider()

  if (!ethersSigner) {
    throw new Error('No signer found!')
  }

  // send 15 USDC to the Safe
  await transfer(ethersSigner, usdcTokenAddress, senderAddress, usdcAmount * 150n)

  console.log(`creating the Safe batch...`)

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]
  const timestamp = (await ethersProvider.getBlock('latest'))?.timestamp || 0

  // 2) Create transaction batch
  const safeOperation = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: timestamp - 60_000,
      validUntil: timestamp + 60_000
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
