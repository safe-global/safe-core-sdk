import { EthersAdapter } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { Safe4337Pack, PimlicoFeeEstimator } from '@safe-global/relay-kit'

// Safe owner PK
const PRIVATE_KEY = ''

const PIMLICO_API_KEY = ''

// Bundler URL
const BUNDLER_URL = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO

// RPC URL
const RPC_URL = 'https://eth-sepolia.public.blastapi.io'

// PAYMASTER ADDRESS
const paymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f'

// USDC CONTRACT ADDRESS IN SEPOLIA
// faucet: https://faucet.circle.com/
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

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
      paymasterTokenAddress: usdcTokenAddress,
      paymasterAddress
      // amountToApprove?: bigint // optional value to set the paymaster approve amount on the deployment
    },
    options: {
      owners: [await signer.getAddress()],
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

  const usdcAmount = 100_000n // 0.1 USDC

  console.log(`sending USDC...`)

  // send 5 USDC to the Safe
  await transfer(signer, usdcTokenAddress, senderAddress, usdcAmount * 50n)

  console.log(`creating the Safe batch...`)

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]

  // 2) Create transaction batch
  const safeOperation = await safe4337Pack.createTransaction({
    transactions
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

const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'
  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

async function transfer(signer: ethers.Wallet, tokenAddress: string, to: string, amount: bigint) {
  const transferEC20 = {
    to: tokenAddress,
    data: generateTransferCallData(to, amount),
    value: '0'
  }

  const transactionResponse = await signer.sendTransaction(transferEC20)

  return await transactionResponse.wait()
}
