import { ethers } from 'ethers'
import { getAccountNonce } from 'permissionless'
import { UserOperation, bundlerActions } from 'permissionless'
import { setTimeout } from 'timers/promises'
import { pimlicoBundlerActions, pimlicoPaymasterActions } from 'permissionless/actions/pimlico'
import { Address, createClient, createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { sepolia } from 'viem/chains'
import {
  EIP712_SAFE_OPERATION_TYPE,
  SAFE_ADDRESSES_MAP,
  encodeCallData,
  getAccountAddress,
  getAccountInitCode
} from './utils/safe'
import {
  generateTransferCallData,
  getERC20Balance,
  getERC20Decimals,
  transferERC20Token
} from './utils/erc20'
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

const PRIVATE_KEY = ''
const PIMLICO_API_KEY = ''
const USE_PAYMASTER = true
const CHAIN_ID = 11155111
const CHAIN = 'sepolia'
const ENTRY_POINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
const RPC_URL = 'https://eth-sepolia.public.blastapi.io'

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

  let protocolKit: Safe

  if (isSafeDeployed) {
    protocolKit = await Safe.create({ ethAdapter: ethersAdapter, safeAddress })
  } else {
    protocolKit = await Safe.create({
      ethAdapter: ethersAdapter,
      predictedSafe: { safeAccountConfig }
    })
  }

  return protocolKit
}

async function main() {
  const protocolKit: Safe = await getProtocolKitInstance(RPC_URL, PRIVATE_KEY)
  const signerAddress = (await protocolKit.getEthAdapter().getSignerAddress()) as `0x${string}`
  const safe4337Pack = new Safe4337Pack({ protocolKit })

  // Clients initialization
  const bundlerClient = createClient({
    transport: http(`https://api.pimlico.io/v1/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`),
    chain: sepolia
  })
    .extend(bundlerActions)
    .extend(pimlicoBundlerActions)

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
    chain: sepolia
  })

  const paymasterClient = createClient({
    transport: http(`https://api.pimlico.io/v2/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`),
    chain: sepolia
  }).extend(pimlicoPaymasterActions)

  const walletClient = createWalletClient({
    account: signerAddress,
    chain: sepolia,
    transport: http(`https://api.pimlico.io/v1/${CHAIN}/rpc?apikey=${PIMLICO_API_KEY}`)
  })

  const submitUserOperation = async (userOperation: UserOperation) => {
    const userOperationHash = await bundlerClient.sendUserOperation({
      userOperation,
      entryPoint: ENTRY_POINT_ADDRESS as Address
    })
    console.log(`UserOperation submitted. Hash: ${userOperationHash}`)
    console.log(
      `UserOp Link: https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=` + CHAIN + '\n'
    )

    console.log('Querying for receipts...')
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash
    })
    console.log(`Receipt found!\nTransaction hash: ${receipt.receipt.transactionHash}`)

    console.log(
      `Transaction Link: https://` + CHAIN + `.etherscan.io/tx/${receipt.receipt.transactionHash}`
    )

    console.log(`\nGas Used (Account or Paymaster): ${receipt.actualGasUsed}`)
    console.log(`Gas Used (Transaction): ${receipt.receipt.gasUsed}\n`)
  }

  const erc20PaymasterAddress = '0x0000000000325602a77416A16136FDafd04b299f'
  const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  // from safe-deployments
  const multiSendAddress = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526'

  const initCode = await getAccountInitCode({
    owner: signerAddress,
    addModuleLibAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].ADD_MODULES_LIB_ADDRESS,
    safe4337ModuleAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_4337_MODULE_ADDRESS,
    safeProxyFactoryAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_PROXY_FACTORY_ADDRESS,
    safeSingletonAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_SINGLETON_ADDRESS,
    saltNonce: 4n,
    erc20TokenAddress: usdcTokenAddress,
    multiSendAddress,
    paymasterAddress: erc20PaymasterAddress
  })

  const senderAddress = await getAccountAddress({
    client: publicClient,
    owner: signerAddress,
    addModuleLibAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].ADD_MODULES_LIB_ADDRESS,
    safe4337ModuleAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_4337_MODULE_ADDRESS,
    safeProxyFactoryAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_PROXY_FACTORY_ADDRESS,
    safeSingletonAddress: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_SINGLETON_ADDRESS,
    saltNonce: 4n,
    erc20TokenAddress: usdcTokenAddress,
    multiSendAddress,
    paymasterAddress: erc20PaymasterAddress
  })

  console.log('Counterfactual sender address:', senderAddress)

  // Fetch USDC balance of sender

  const senderUsdcBalance = await publicClient.readContract({
    abi: [
      {
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
        stateMutability: 'view'
      }
    ],
    address: usdcTokenAddress,
    functionName: 'balanceOf',
    args: [senderAddress]
  })

  console.log('Smart Account USDC Balance:', Number(senderUsdcBalance / 1000000n))

  const newNonce = await getAccountNonce(publicClient, {
    entryPoint: ENTRY_POINT_ADDRESS as Address,
    sender: senderAddress
  })

  const signer = privateKeyToAccount(PRIVATE_KEY)

  const signUserOperation = async (userOperation: UserOperation) => {
    const signatures = [
      {
        signer: signerAddress,
        data: await signer.signTypedData({
          domain: {
            chainId: CHAIN_ID,
            verifyingContract: SAFE_ADDRESSES_MAP['1.4.1'][CHAIN_ID].SAFE_4337_MODULE_ADDRESS
          },
          types: EIP712_SAFE_OPERATION_TYPE,
          primaryType: 'SafeOp',
          message: {
            safe: userOperation.sender,
            nonce: userOperation.nonce,
            initCode: userOperation.initCode,
            callData: userOperation.callData,
            callGasLimit: userOperation.callGasLimit,
            verificationGasLimit: userOperation.verificationGasLimit,
            preVerificationGas: userOperation.preVerificationGas,
            maxFeePerGas: userOperation.maxFeePerGas,
            maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
            paymasterAndData: userOperation.paymasterAndData,
            validAfter: '0x000000000000',
            validUntil: '0x000000000000',
            entryPoint: ENTRY_POINT_ADDRESS
          }
        })
      }
    ]

    signatures.sort((left, right) =>
      left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
    )

    let signatureBytes: Address = '0x000000000000000000000000'
    for (const sig of signatures) {
      signatureBytes += sig.data.slice(2)
    }

    return signatureBytes
  }

  const contractCode = await publicClient.getBytecode({ address: senderAddress })

  if (contractCode) {
    console.log('The Safe is already deployed. Sending 1 USDC from the Safe to itself.')
  } else {
    console.log('Deploying a new Safe and transferring 1 USDC to itself in one tx')
  }

  const sponsoredUserOperation: UserOperation = {
    sender: senderAddress,
    nonce: newNonce,
    initCode: contractCode ? '0x' : initCode,
    // Send 1 USDC to the Safe itself
    callData: encodeCallData({
      to: usdcTokenAddress,
      data: generateTransferCallData(senderAddress, 1000000n),
      value: 0n
    }),
    callGasLimit: 1n,
    verificationGasLimit: 1n,
    preVerificationGas: 1n,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
    paymasterAndData: erc20PaymasterAddress, // to use the erc20 paymaster, put its address in the paymasterAndData field
    signature: '0x'
  }

  const gasEstimate = await bundlerClient.estimateUserOperationGas({
    userOperation: sponsoredUserOperation,
    entryPoint: ENTRY_POINT_ADDRESS as Address
  })
  const maxGasPriceResult = await bundlerClient.getUserOperationGasPrice()

  sponsoredUserOperation.callGasLimit = gasEstimate.callGasLimit
  sponsoredUserOperation.verificationGasLimit = gasEstimate.verificationGasLimit
  sponsoredUserOperation.preVerificationGas = gasEstimate.preVerificationGas
  sponsoredUserOperation.maxFeePerGas = maxGasPriceResult.fast.maxFeePerGas
  sponsoredUserOperation.maxPriorityFeePerGas = maxGasPriceResult.fast.maxPriorityFeePerGas

  if (USE_PAYMASTER) {
    const sponsorResult = await paymasterClient.sponsorUserOperation({
      userOperation: sponsoredUserOperation,
      entryPoint: ENTRY_POINT_ADDRESS as Address
    })

    sponsoredUserOperation.callGasLimit = sponsorResult.callGasLimit
    sponsoredUserOperation.verificationGasLimit = sponsorResult.verificationGasLimit
    sponsoredUserOperation.preVerificationGas = sponsorResult.preVerificationGas
    sponsoredUserOperation.paymasterAndData = sponsorResult.paymasterAndData
  } else {
    // Fetch USDC balance of sender
    const usdcDecimals = await getERC20Decimals(usdcTokenAddress, publicClient)
    const usdcAmount = BigInt(10 ** usdcDecimals)
    let senderUSDCBalance = await getERC20Balance(usdcTokenAddress, publicClient, senderAddress)
    console.log('\nSafe Wallet USDC Balance:', Number(senderUSDCBalance / usdcAmount))

    if (senderUSDCBalance < BigInt(1) * usdcAmount) {
      console.log('\nTransferring 1 USDC Token for paying the Paymaster from Sender to Safe.')
      await transferERC20Token(
        usdcTokenAddress,
        publicClient,
        signerAddress,
        senderAddress,
        BigInt(1) * usdcAmount,
        walletClient
      )

      while (senderUSDCBalance < BigInt(1) * usdcAmount) {
        await setTimeout(15000)

        senderUSDCBalance = await getERC20Balance(usdcTokenAddress, publicClient, senderAddress)
      }
      console.log('\nUpdated Safe Wallet USDC Balance:', Number(senderUSDCBalance / usdcAmount))
    }
  }

  sponsoredUserOperation.signature = await signUserOperation(sponsoredUserOperation)

  console.log('User Operation', sponsoredUserOperation)

  // await submitUserOperation(sponsoredUserOperation)
}

main()
