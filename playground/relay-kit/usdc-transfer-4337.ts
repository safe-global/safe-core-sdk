import { ethers } from 'ethers'
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

// Safe 4337 compatible
const SAFE_ADDRESS = '0xafBCFd223dD0Cb420E628Ceb1E438f9F5b6FB24b'

// safe owner PK
const PRIVATE_KEY = ''

// pimlico Api key see: https://docs.pimlico.io/permissionless/tutorial/tutorial-1#get-a-pimlico-api-key
const PIMLICO_API_KEY = ''

const CHAIN = 'sepolia'
const RPC_URL = 'https://eth-sepolia.public.blastapi.io'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'

  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

async function main() {
  const safe4337Pack = await Safe4337Pack.init({
    privateKey: PRIVATE_KEY,
    rpcUrl: RPC_URL,
    bundlerUrl: `https://api.pimlico.io/v1/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`,
    safeOptions: {
      owners: ['0xD725e11588f040d86c4C49d8236E32A5868549F0'],
      threshold: 1
    }
  })

  // TODO: implement paymaster
  // const erc20PaymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f'

  const senderAddress = (await safe4337Pack.protocolKit.getAddress()) as `0x${string}`

  // TODO: implement counterfactual deployment
  // const isSafeDeployed = await protocolKit.isSafeDeployed()

  // if (!isSafeDeployed) {
  //   console.log('Counterfactual deployment not implemented!!!')
  //   process.exit(0)
  // }

  const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  const usdcAmount = 1000000n // 1 USDC

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, usdcAmount),
    value: '0'
  }

  // 2 USDC transfers as a batch
  const transactions = [transferUSDC, transferUSDC]

  // we crate the 4337 relay transaction
  const sponsoredUserOperation = await safe4337Pack.createRelayedTransaction({
    transactions
  })

  console.log('User Operation', sponsoredUserOperation)

  // we sign the transaction with our owner
  const signedSafeUserOperation = await safe4337Pack.signSafeUserOperation(sponsoredUserOperation)

  console.log('Signed User Operation', signedSafeUserOperation)
  // const userOperationHash = await safe4337Pack.executeRelayTransaction(signedSafeUserOperation)

  // console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${CHAIN}`)
}

main()
