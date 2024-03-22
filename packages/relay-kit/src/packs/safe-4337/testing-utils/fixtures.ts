export const OWNER_1 = '0xFfAC5578BE8AC1B2B9D13b34cAf4A074B96B8A1b'
export const SAFE_ADDRESS_v1_4_1 = '0x717f4BB83D8DF2e5a3Cc603Ee27263ac9EFB6c12'
export const SAFE_ADDRESS_v1_3_0 = '0x8C35a08Af278518B59D04ddDe3F1b370aD766D22'
export const PAYMASTER_ADDRESS = '0x0000000000325602a77416A16136FDafd04b299f'
export const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
export const CHAIN_ID = '0xaa36a7'

export const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
export const BUNDLER_URL = 'https://bundler.url'
export const PAYMASTER_URL = 'https://paymaster.url'

export const USER_OPERATION_HASH =
  '0x3cb881d1969036174f38d636d22108d1d032145518b53104fc0b1e1296d2cc9c'

export const ENTRYPOINTS = [
  '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
]

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

export const SPONSORED_GAS_ESTIMATION = {
  paymasterAndData: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
  ...GAS_ESTIMATION
}

export const USER_OPERATION_GAS_PRICE = {
  fast: { maxFeePerGas: '0x186A0', maxPriorityFeePerGas: '0x30D40' }
}
