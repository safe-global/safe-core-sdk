import { ethers } from 'ethers'
import { getAccountNonce } from 'permissionless'
import { bundlerActions } from 'permissionless'
import { setTimeout } from 'timers/promises'
import { pimlicoBundlerActions, pimlicoPaymasterActions } from 'permissionless/actions/pimlico'
import { Address, createClient, createPublicClient, createWalletClient, http, Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { sepolia } from 'viem/chains'
import {
  EIP712_SAFE_OPERATION_TYPE,
  SAFE_ADDRESSES_MAP,
  encodeCallData,
  getAccountAddress,
  getAccountInitCode
} from './utils/safe'
import { getERC20Balance, getERC20Decimals, transferERC20Token } from './utils/erc20'
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { OperationType } from '@safe-global/safe-core-sdk-types'

const PRIVATE_KEY = ''
const PIMLICO_API_KEY = ''
const USE_PAYMASTER = true
const CHAIN_ID = 11155111
const CHAIN = 'sepolia'
const ENTRY_POINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
const RPC_URL = 'https://eth-sepolia.public.blastapi.io'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'

  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

// Current test Safe https://app.safe.global/balances?safe=sep:0xafBCFd223dD0Cb420E628Ceb1E438f9F5b6FB24b
const getProtocolKitInstance = async (rpcUrl: string, privateKey: string): Promise<Safe> => {
  // Counterfactual Safe and Relay initialization
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(privateKey, provider)
  const ethersAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  })

  const signerAddress = await ethersAdapter.getSignerAddress()

  const owners = [signerAddress || '0x']
  const threshold = 1

  const safeAccountConfig: SafeAccountConfig = {
    owners,
    threshold
  }

  const safeAddress = await predictSafeAddress({
    ethAdapter: ethersAdapter,
    chainId: await ethersAdapter.getChainId(),
    safeAccountConfig
  })

  const isSafeDeployed = await ethersAdapter.isContractDeployed(safeAddress)

  // let protocolKit: Safe

  // if (isSafeDeployed) {
  const protocolKit = await Safe.create({
    ethAdapter: ethersAdapter,
    safeAddress: '0xafBCFd223dD0Cb420E628Ceb1E438f9F5b6FB24b'
  })
  // } else {
  //   protocolKit = await Safe.create({
  //     ethAdapter: ethersAdapter,
  //     predictedSafe: { safeAccountConfig, safeDeploymentConfig: { saltNonce: '0x1' } }
  //   })
  // }

  return protocolKit
}

async function main() {
  const protocolKit: Safe = await getProtocolKitInstance(RPC_URL, PRIVATE_KEY)
  const signerAddress = (await protocolKit.getEthAdapter().getSignerAddress()) as `0x${string}`
  const safe4337Pack = new Safe4337Pack({
    protocolKit,
    rpcUrl: RPC_URL,
    bundlerUrl: `https://api.pimlico.io/v1/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`
  })

  const erc20PaymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f'
  const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  // from safe-deployments
  const multiSendAddress = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526'

  const senderAddress = (await protocolKit.getAddress()) as `0x${string}`

  console.log('Counterfactual sender address:', senderAddress)

  // const isSafeDeployed = await publicClient.getBytecode({ address: senderAddress })
  const isSafeDeployed = await protocolKit.isSafeDeployed()

  if (isSafeDeployed) {
    console.log('The Safe is already deployed. Sending 1 USDC from the Safe to itself.')
  } else {
    console.log('Deploying a new Safe and transferring 1 USDC to itself in one tx')
  }

  const sponsoredUserOperation = await safe4337Pack.createRelayedTransaction({
    transactions: [
      {
        to: usdcTokenAddress,
        data: generateTransferCallData(senderAddress, 1000000n),
        value: '0',
        operation: OperationType.DelegateCall
      }
    ]
  })

  const signedSafeUserOperation = await safe4337Pack.signSafeUserOperation(sponsoredUserOperation)
  const what = await safe4337Pack.executeRelayTransaction(signedSafeUserOperation)
  console.log(what)

  console.log('User Operation', sponsoredUserOperation)
}

main()
