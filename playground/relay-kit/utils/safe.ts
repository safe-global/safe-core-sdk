import {
  Address,
  Chain,
  Hex,
  PublicClient,
  Transport,
  concatHex,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256,
  zeroAddress
} from 'viem'
import { InternalTx, encodeMultiSend } from './multisend'
import { generateApproveCallData } from './erc20'

export const SAFE_ADDRESSES_MAP = {
  '1.4.1': {
    '11155111': {
      ADD_MODULES_LIB_ADDRESS: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
      SAFE_4337_MODULE_ADDRESS: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
      SAFE_PROXY_FACTORY_ADDRESS: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
      SAFE_SINGLETON_ADDRESS: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'
    }
  }
} as const

const getInitializerCode = async ({
  owner,
  addModuleLibAddress,
  safe4337ModuleAddress,
  multiSendAddress,
  erc20TokenAddress,
  paymasterAddress
}: {
  owner: Address
  addModuleLibAddress: Address
  safe4337ModuleAddress: Address
  multiSendAddress: Address
  erc20TokenAddress: Address
  paymasterAddress: Address
}) => {
  console.log(multiSendAddress)
  const setupTxs: InternalTx[] = [
    {
      to: addModuleLibAddress,
      data: enableModuleCallData(safe4337ModuleAddress),
      value: 0n,
      operation: 1 // 1 = DelegateCall required for enabling the module
    },
    {
      to: erc20TokenAddress,
      data: generateApproveCallData(paymasterAddress),
      value: 0n,
      operation: 0 // 0 = Call
    }
  ]

  const multiSendCallData = encodeMultiSend(setupTxs)

  return encodeFunctionData({
    abi: [
      {
        inputs: [
          {
            internalType: 'address[]',
            name: '_owners',
            type: 'address[]'
          },
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256'
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          },
          {
            internalType: 'address',
            name: 'fallbackHandler',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'paymentToken',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'payment',
            type: 'uint256'
          },
          {
            internalType: 'address payable',
            name: 'paymentReceiver',
            type: 'address'
          }
        ],
        name: 'setup',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'setup',
    args: [
      [owner],
      1n,
      addModuleLibAddress,
      enableModuleCallData(safe4337ModuleAddress),
      safe4337ModuleAddress,
      zeroAddress,
      0n,
      zeroAddress
    ]
  })
}

export const enableModuleCallData = (safe4337ModuleAddress: `0x${string}`) => {
  return encodeFunctionData({
    abi: [
      {
        inputs: [
          {
            internalType: 'address[]',
            name: 'modules',
            type: 'address[]'
          }
        ],
        name: 'enableModules',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'enableModules',
    args: [[safe4337ModuleAddress]]
  })
}

export const getAccountInitCode = async ({
  owner,
  addModuleLibAddress,
  safe4337ModuleAddress,
  safeProxyFactoryAddress,
  safeSingletonAddress,
  saltNonce,
  erc20TokenAddress,
  multiSendAddress,
  paymasterAddress
}: {
  owner: Address
  addModuleLibAddress: Address
  safe4337ModuleAddress: Address
  safeProxyFactoryAddress: Address
  safeSingletonAddress: Address
  saltNonce: string
  erc20TokenAddress: Address
  multiSendAddress: Address
  paymasterAddress: Address
}): Promise<Hex> => {
  if (!owner) throw new Error('Owner account not found')
  const initializer = await getInitializerCode({
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress,
    erc20TokenAddress,
    multiSendAddress,
    paymasterAddress
  })
  console.log('salt', saltNonce, BigInt('0x' + saltNonce))
  const initCodeCallData = encodeFunctionData({
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: '_singleton',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'initializer',
            type: 'bytes'
          },
          {
            internalType: 'uint256',
            name: 'saltNonce',
            type: 'uint256'
          }
        ],
        name: 'createProxyWithNonce',
        outputs: [
          {
            internalType: 'contract SafeProxy',
            name: 'proxy',
            type: 'address'
          }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'createProxyWithNonce',
    args: [safeSingletonAddress, initializer, BigInt('0x' + saltNonce)]
  })
  console.log(
    'encodeCreateProxyWithNonce',
    safeSingletonAddress,
    initializer,
    BigInt('0x' + saltNonce)
  )
  console.log('CreateProxyWithNonce call data', initCodeCallData)

  return concatHex([safeProxyFactoryAddress, initCodeCallData])
}

export const EIP712_SAFE_OPERATION_TYPE = {
  SafeOp: [
    { type: 'address', name: 'safe' },
    { type: 'uint256', name: 'nonce' },
    { type: 'bytes', name: 'initCode' },
    { type: 'bytes', name: 'callData' },
    { type: 'uint256', name: 'callGasLimit' },
    { type: 'uint256', name: 'verificationGasLimit' },
    { type: 'uint256', name: 'preVerificationGas' },
    { type: 'uint256', name: 'maxFeePerGas' },
    { type: 'uint256', name: 'maxPriorityFeePerGas' },
    { type: 'bytes', name: 'paymasterAndData' },
    { type: 'uint48', name: 'validAfter' },
    { type: 'uint48', name: 'validUntil' },
    { type: 'address', name: 'entryPoint' }
  ]
}

export const encodeCallData = (params: { to: Address; value: bigint; data: `0x${string}` }) => {
  return encodeFunctionData({
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256'
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes'
          },
          {
            internalType: 'uint8',
            name: 'operation',
            type: 'uint8'
          }
        ],
        name: 'executeUserOp',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'executeUserOp',
    args: [params.to, params.value, params.data, 0]
  })
}

export const getAccountAddress = async ({
  client,
  owner,
  addModuleLibAddress,
  safe4337ModuleAddress,
  safeProxyFactoryAddress,
  safeSingletonAddress,
  saltNonce,
  erc20TokenAddress,
  multiSendAddress,
  paymasterAddress
}: {
  client: PublicClient
  owner: Address
  addModuleLibAddress: Address
  safe4337ModuleAddress: Address
  safeProxyFactoryAddress: Address
  safeSingletonAddress: Address
  saltNonce?: string
  erc20TokenAddress: Address
  multiSendAddress: Address
  paymasterAddress: Address
}): Promise<Address> => {
  const proxyCreationCode = await client.readContract({
    abi: [
      {
        inputs: [],
        name: 'proxyCreationCode',
        outputs: [
          {
            internalType: 'bytes',
            name: '',
            type: 'bytes'
          }
        ],
        stateMutability: 'pure',
        type: 'function'
      }
    ],
    address: safeProxyFactoryAddress,
    functionName: 'proxyCreationCode'
  })

  const deploymentCode = encodePacked(
    ['bytes', 'uint256'],
    [proxyCreationCode, hexToBigInt(safeSingletonAddress)]
  )
  console.log('deploymentCode', deploymentCode)
  const initializer = await getInitializerCode({
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress,
    erc20TokenAddress,
    multiSendAddress,
    paymasterAddress
  })
  console.log('initializer', initializer)
  const salt = keccak256(
    encodePacked(
      ['bytes32', 'uint256'],
      [keccak256(encodePacked(['bytes'], [initializer])), BigInt('0x' + saltNonce)]
    )
  )
  console.log('salt', salt)
  return getContractAddress({
    from: safeProxyFactoryAddress,
    salt,
    bytecode: deploymentCode,
    opcode: 'CREATE2'
  })
}
