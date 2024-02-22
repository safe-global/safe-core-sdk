import { EthersAdapter } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'

// Safe owner PK
const PRIVATE_KEY = ''

// Pimlico Api key see: https://docs.pimlico.io/permissionless/tutorial/tutorial-1#get-a-pimlico-api-key
const PIMLICO_API_KEY = ''

// Chain name
const CHAIN = 'sepolia'

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

  // Initialize pack
  const safe4337Pack = await Safe4337Pack.init({
    ethersAdapter,
    rpcUrl: RPC_URL,
    bundlerUrl: `https://api.pimlico.io/v1/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`,
    options: {
      owners: ['0xD725e11588f040d86c4C49d8236E32A5868549F0'],
      threshold: 1
    }
  })

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

  // Create relayed transaction and send UserOperation to the bundler
  const sponsoredUserOperation = await safe4337Pack.createRelayedTransaction({
    transactions
  })
  const signedSafeUserOperation = await safe4337Pack.signSafeUserOperation(sponsoredUserOperation)
  const userOperationHash = await safe4337Pack.executeRelayTransaction(signedSafeUserOperation)

  console.log('Signed User Operation', signedSafeUserOperation)
  console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${CHAIN}`)
}

main()
