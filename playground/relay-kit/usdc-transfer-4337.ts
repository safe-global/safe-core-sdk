import { EthersAdapter } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import {
  Safe4337Pack,
  pimlico_prepareGasEstimation as prepareGasEstimation,
  pimlico_adjustGasEstimation as adjustGasEstimation,
  alchemy_prepareGasEstimation,
  alchemy_adjustGasEstimation
} from '@safe-global/relay-kit'

// Safe owner PK
const PRIVATE_KEY = ''

// Bundler URL
const BUNDLER_URL =
  'https://api.pimlico.io/v1/sepolia/rpc?apikey=30b296fa-8947-4775-b44a-b225336e2a66' // PIMLICO
// const BUNDLER_URL = 'https://eth-sepolia.g.alchemy.com/v2/0_Uae8YJ3042uzuMXZ-5-BmJFy85qxKk' // ALCHEMY

// RPC URL
const RPC_URL = 'https://eth-sepolia.public.blastapi.io'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'
  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

async function main() {
  // Instantiate EtherAdapter
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(PRIVATE_KEY, provider)
  const ethersAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  })

  // 1) Initialize pack
  const safe4337Pack = await Safe4337Pack.init({
    ethersAdapter,
    rpcUrl: RPC_URL,
    bundlerUrl: BUNDLER_URL,
    options: {
      owners: ['0xD725e11588f040d86c4C49d8236E32A5868549F0'],
      threshold: 1
    }
  })

  // Log supported entry points and chain id
  console.log('Supported Entry Points', await safe4337Pack.getSupportedEntryPoints())
  console.log('Chain Id', await safe4337Pack.getChainId())

  // Create transaction batch to transfer 2 USDC
  const senderAddress = (await safe4337Pack.protocolKit.getAddress()) as `0x${string}`
  const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  const usdcAmount = 1000000n // 1 USDC
  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]

  // 2) Create transaction batch
  const safeOperation = await safe4337Pack.createTransaction({ transactions })

  // 3) Estimate SafeOperation fee
  const estimatedSafeOperation = await safe4337Pack.getEstimateFee({
    safeOperation,
    prepareGasEstimation,
    adjustGasEstimation
  })

  // 4) Sign SafeOperation
  const estimatedAndSignedSafeOperation =
    await safe4337Pack.signSafeOperation(estimatedSafeOperation)

  console.log('SafeOperation', estimatedAndSignedSafeOperation)

  // 5) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction(estimatedAndSignedSafeOperation)

  console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=sepolia`)

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
