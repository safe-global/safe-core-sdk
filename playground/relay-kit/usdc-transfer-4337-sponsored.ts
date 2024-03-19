import { EthersAdapter } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { Safe4337Pack, PimlicoFeeEstimator } from '@safe-global/relay-kit'

// Safe owner PK
const PRIVATE_KEY = ''

const PIMLICO_API_KEY = ''

// Safe 4337 compatible
const SAFE_ADDRESS = ''

//  PolicyId is an optional parameter, you can create one here: https://dashboard.pimlico.io/sponsorship-policies
const POLICY_ID = ''

// CHAIN
const CHAIN_NAME = 'sepolia'
// const CHAIN_NAME = 'gnosis'

// RPC URL
const RPC_URL = 'https://rpc.ankr.com/eth_sepolia' // SEPOLIA
// const RPC_URL = 'https://rpc.gnosischain.com/' // GNOSIS

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v1/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// Paymaster URL
const PAYMASTER_URL = `https://api.pimlico.io/v2/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// PAYMASTER ADDRESS
const paymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f' // SEPOLIA
// const paymasterAddress = '0x000000000034B78bfe02Be30AE4D324c8702803d' // GNOSIS

// USDC CONTRACT ADDRESS IN SEPOLIA
// faucet: https://faucet.circle.com/
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // SEPOLIA
// const usdcTokenAddress = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83' // GNOSIS

async function main() {
  // Instantiate EtherAdapter
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(PRIVATE_KEY, provider)
  const ethersAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  })

  // 1) Initialize pack with the paymaster data
  const safe4337Pack = await Safe4337Pack.init({
    ethersAdapter,
    rpcUrl: RPC_URL,
    bundlerUrl: BUNDLER_URL,
    paymasterOptions: {
      isSponsored: true,
      paymasterUrl: PAYMASTER_URL,
      paymasterAddress,
      sponsorshipPolicyId: POLICY_ID
    },
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  // Log supported entry points and chain id
  console.log('Supported Entry Points', await safe4337Pack.getSupportedEntryPoints())
  console.log('Chain Id', await safe4337Pack.getChainId())

  // Create transaction batch with two 0.1 USDC transfers
  const senderAddress = (await safe4337Pack.protocolKit.getAddress()) as `0x${string}`

  const usdcAmount = 100_000n // 0.1 USDC

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]
  const timestamp = (await provider.getBlock('latest'))?.timestamp || 0

  // 2) Create transaction batch
  const safeOperation = await safe4337Pack.createTransaction({
    transactions,
    options: {
      validAfter: timestamp,
      validUntil: timestamp + 60000
    }
  })

  // 3) Estimate SafeOperation fee
  const feeEstimator = new PimlicoFeeEstimator()
  const estimatedSafeOperation = await safe4337Pack.getEstimateFee({
    safeOperation,
    feeEstimator
  })

  // 4) Sign SafeOperation
  const estimatedAndSignedSafeOperation =
    await safe4337Pack.signSafeOperation(estimatedSafeOperation)

  console.log('SafeOperation', estimatedAndSignedSafeOperation)

  // 5) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: estimatedAndSignedSafeOperation
  })

  console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${CHAIN_NAME}`)

  let userOperationReceipt = null
  while (!userOperationReceipt) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOperationHash)
  }

  console.group('User Operation Receipt and hash')
  console.log('User Operation Receipt', userOperationReceipt)
  console.log(
    'User Operation By Hash',
    await safe4337Pack.getUserOperationByHash(userOperationHash)
  )
  console.groupEnd()
}

main()

const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'
  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}
