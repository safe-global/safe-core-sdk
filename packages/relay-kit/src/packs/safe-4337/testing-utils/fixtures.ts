import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from '../constants'

export const OWNER_1 = '0xFfAC5578BE8AC1B2B9D13b34cAf4A074B96B8A1b'
export const OWNER_2 = '0x3059EfD1BCe33be41eeEfd5fb6D520d7fEd54E43'
export const PREDICTED_SAFE_ADDRESS = '0x65e0d294F2d17CB9fB0f65111E9Ac8a00C4049dA'
export const SAFE_ADDRESS_v1_4_1 = '0x717f4BB83D8DF2e5a3Cc603Ee27263ac9EFB6c12'
export const SAFE_ADDRESS_v1_3_0 = '0x8C35a08Af278518B59D04ddDe3F1b370aD766D22'
export const SAFE_ADDRESS_4337_MODULE_NOT_ENABLED = '0xfC82a1e4A045a44527e8b45FC70332C8F66fc32B'
export const SAFE_ADDRESS_4337_FALLBACKHANDLER_NOT_ENABLED =
  '0xA6FDc4e18404E1715D1bC51B07266c91393C6622'
export const SAFE_ADDRESS_4337_PASSKEY = '0x6FC89F63A59776BE6679c5b09554D919eeDa41a7' // Safe owned by passkey signer + 4337 module + fallback handler enabled
export const SAFE_MODULES_V0_3_0 = '0.3.0'
export const PAYMASTER_ADDRESS = '0x0000000000325602a77416A16136FDafd04b299f'
export const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
export const CHAIN_ID = '0xaa36a7'
export const MODULE_ADDRESS = '0xa581c4A4DB7175302464fF3C06380BC3270b4037'
export const RPC_URL = 'https://sepolia.gateway.tenderly.co'
export const BUNDLER_URL = 'https://bundler.url'
export const PAYMASTER_URL = 'https://paymaster.url'

export const USER_OPERATION_HASH =
  '0x3cb881d1969036174f38d636d22108d1d032145518b53104fc0b1e1296d2cc9c'

export const ENTRYPOINTS = [ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07]

export const USER_OPERATION_RECEIPT = {
  userOpHash: '0x3cb881d1969036174f38d636d22108d1d032145518b53104fc0b1e1296d2cc9c',
  sender: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
  nonce: '0x1',
  actualGasUsed: '0x27067',
  actualGasCost: '0x42f29418377167',
  success: true,
  logs: [],
  receipt: {
    transactionHash: '0xef262d20f68e4900aa6380b8ac0f66f9c00a7d988179fa177ad9c9758f0e380e',
    transactionIndex: '0x63',
    blockHash: '0x65f8249337ffede2067a006a96da47d3d3445ca72492a6a82afa02899f05d2e5',
    blockNumber: '0x5378b9',
    from: '0x4337001Fff419768e088Ce247456c1B892888084',
    to: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    cumulativeGasUsed: '0xc1a846',
    gasUsed: '0x25e6c',
    contractAddress: null,
    logs: [],
    logsBloom:
      '0x000000000000900000000000000000000000000000000000080000000002000000080000000000000402000100000000001000000000000080000200000100000000000000000000000000080000000000000000000000000000002000002000000000000a0000000000000000000800000000000000000000000010000200000000000060100000000000000040000000800000000000000008800000000000000000000000000000400000000000000200000000000000000002000000008000000002000100000001000000000000000000000020000000000000000020010040000000000020000010000008000200000000000000000000000000000000',
    status: '0x1',
    effectiveGasPrice: '0x1b67f3c201'
  }
}

export const USER_OPERATION = {
  sender: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
  nonce: '0x1',
  initCode: '0x',
  callData:
    '0x7bb3742800000000000000000000000038869bf66a61cf6bdb996a6ae40d5853fd43b52600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001848d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000132001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  callGasLimit: 120_784n,
  verificationGasLimit: 83_056n,
  preVerificationGas: 48_568n,
  maxFeePerGas: 193_584_757_388n,
  maxPriorityFeePerGas: 1_380_000_000n,
  paymasterAndData: '0x',
  signature:
    '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
}

export const USER_OPERATION_HEX_VALUES = {
  sender: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
  nonce: '0x1',
  initCode: '0x',
  callData:
    '0x7bb3742800000000000000000000000038869bf66a61cf6bdb996a6ae40d5853fd43b52600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001848d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000132001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  callGasLimit: '0x1d7d0',
  verificationGasLimit: '0x14470',
  preVerificationGas: '0xbdb8',
  maxFeePerGas: '0x2d128cfa8c',
  maxPriorityFeePerGas: '0x52412100',
  paymasterAndData: '0x',
  signature:
    '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
}

export const USER_OPERATION_BY_HASH = {
  userOperation: USER_OPERATION_HEX_VALUES,
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  transactionHash: '0xef262d20f68e4900aa6380b8ac0f66f9c00a7d988179fa177ad9c9758f0e380e',
  blockHash: '0x65f8249337ffede2067a006a96da47d3d3445ca72492a6a82afa02899f05d2e5',
  blockNumber: '0x5378b9'
}

export const GAS_ESTIMATION = {
  verificationGasLimit: '0x186A0',
  preVerificationGas: '0x186A0',
  callGasLimit: '0x186A0'
}

export const SAFE_OPERATION_RESPONSE = {
  created: '2024-05-31T10:12:21.169031Z',
  modified: '2024-05-31T10:12:21.169031Z',
  safeOperationHash: '0x5a62b1d61f8fca5f766e9456523bb42765d318058b5f235f967ffe3c2af8b1d7',
  validAfter: null,
  validUntil: null,
  moduleAddress: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
  confirmations: [
    {
      created: '2024-05-31T10:12:21.184585Z',
      modified: '2024-05-31T10:12:21.184585Z',
      owner: '0x3059EfD1BCe33be41eeEfd5fb6D520d7fEd54E43',
      signature:
        '0xcb28e74375889e400a4d8aca46b8c59e1cf8825e373c26fa99c2fd7c078080e64fe30eaf1125257bdfe0b358b5caef68aa0420478145f52decc8e74c979d43ab1d',
      signatureType: 'EOA'
    }
  ],
  preparedSignature:
    '0xcb28e74375889e400a4d8aca46b8c59e1cf8825e373c26fa99c2fd7c078080e64fe30eaf1125257bdfe0b358b5caef68aa0420478145f52decc8e74c979d43ab1c',
  userOperation: {
    ethereumTxHash: null,
    sender: '0xE322e721bCe76cE7FCf3A475f139A9314571ad3D',
    userOperationHash: '0x5d23b7d96a718582601183b1849a4c76b2a13d3787f15074d62a0b6e4a3f76a1',
    nonce: 3,
    initCode: '0x',
    callData:
      '0x7bb37428000000000000000000000000e322e721bce76ce7fcf3a475f139a9314571ad3d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    callGasLimit: 122497,
    verificationGasLimit: 123498,
    preVerificationGas: 50705,
    maxFeePerGas: 105183831060,
    maxPriorityFeePerGas: 1380000000,
    paymaster: null,
    paymasterData: null,
    signature:
      '0x54158da2d357241ee1c5c8fca9c4e1bfa6b92a60bd0ed1bea56f4092b008435153d6264a8a8c00925383ecaeaf9d839a2dc1ff006703c65b7f05d0ce8cdd57ab1b',
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
  }
}

export const SPONSORED_GAS_ESTIMATION = {
  paymasterAndData: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
  ...GAS_ESTIMATION
}

export const USER_OPERATION_GAS_PRICE = {
  fast: { maxFeePerGas: '0x186A0', maxPriorityFeePerGas: '0x30D40' }
}
