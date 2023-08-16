import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { createMemoizedFunction } from '@safe-global/protocol-kit/utils/memoized'
import {
  EthAdapter,
  SafeContract,
  SafeProxyFactoryContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { generateAddress2, keccak256, toBuffer } from 'ethereumjs-util'
import semverSatisfies from 'semver/functions/satisfies'
import { utils as zkSyncUtils } from 'zksync-web3'

import {
  getCompatibilityFallbackHandlerContract,
  getProxyFactoryContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import { ContractNetworkConfig, SafeAccountConfig, SafeDeploymentConfig } from '../types'

// keccak256(toUtf8Bytes('Safe Account Abstraction'))
export const PREDETERMINED_SALT_NONCE =
  '0xb1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f90'

const ZKSYNC_MAINNET = 324
const ZKSYNC_TESTNET = 280
const ZKSYNC_DEPLOYED_BYTECODE: {
  [version: string]: { deployedBytecode: string; deployedBytecodeHash: string }
} = {
  '1.3.0': {
    deployedBytecode:
      '0x000400000000000200000000030100190000006003300270000000360430019700030000004103550002000000010355000000360030019d000100000000001f0000008001000039000000400010043f0000000101200190000000150000c13d000000000100041a00000037021001970000000201000367000000000301043b0000003d0330009c000000590000c13d00000000002004350000003e01000041000000d20001042e0000000001000416000000000110004c000000570000c13d0000000203000367000000400100043d00000000020000310000001f0420018f0000000505200272000000270000613d000000000600001900000005076002100000000008710019000000000773034f000000000707043b00000000007804350000000106600039000000000756004b0000001f0000413d000000000640004c000000360000613d0000000505500210000000000353034f00000000055100190000000304400210000000000605043300000000064601cf000000000646022f000000000303043b0000010004400089000000000343022f00000000034301cf000000000363019f00000000003504350000000003120019000000400030043f000000200220008c000000570000413d00000000010104330000003701100198000000bd0000c13d00000064013000390000003a02000041000000000021043500000044013000390000003b0200004100000000002104350000002401300039000000220200003900000000002104350000003c010000410000000000130435000000040130003900000020020000390000000000210435000000400100043d000000000213004900000084022000390000003603000041000000360420009c0000000002038019000000360410009c000000000103801900000040011002100000006002200210000000000112019f000000d3000104300000000001000019000000d30001043000000000030000310000001f0430018f0000000503300272000000650000613d00000000050000190000000506500210000000000761034f000000000707043b00000000007604350000000105500039000000000635004b0000005e0000413d000000000540004c000000730000613d00000003044002100000000503300210000000000503043300000000054501cf000000000545022f000000000131034f000000000101043b0000010004400089000000000141022f00000000014101cf000000000151019f000000000013043500000000010000310000000003000414000000040420008c000000930000c13d000000030100036700000001020000310000001f0320018f0000000502200272000000840000613d00000000040000190000000505400210000000000651034f000000000606043b00000000006504350000000104400039000000000524004b0000007d0000413d000000000430004c000000ba0000613d00000003033002100000000502200210000000000402043300000000043401cf000000000434022f000000000121034f000000000101043b0000010003300089000000000131022f00000000013101cf000000000141019f0000000000120435000000ba0000013d0000003604000041000000360530009c0000000003048019000000c0033002100000006001100210000000000113001900d100cc0000040f0003000000010355000000000301001900000060043002700000001f0340018f000100360040019d00000036044001970000000504400272000000aa0000613d00000000050000190000000506500210000000000761034f000000000707043b00000000007604350000000105500039000000000645004b000000a30000413d000000000530004c000000b80000613d00000003033002100000000504400210000000000504043300000000053501cf000000000535022f000000000141034f000000000101043b0000010003300089000000000131022f00000000013101cf000000000151019f00000000001404350000000101200190000000c60000613d000000600100003900000001011001ff000000d20001042e000000000200041a0000003802200197000000000112019f000000000010041b0000002001000039000001000010044300000120000004430000003901000041000000d20001042e00000036010000410000000102000031000000360320009c00000000010240190000006001100210000000d300010430000000cf002104250000000102000039000000000001042d0000000002000019000000000001042d000000d100000432000000d20001042e000000d300010430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffff000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000002000000000000000000000000000000400000010000000000000000006564000000000000000000000000000000000000000000000000000000000000496e76616c69642073696e676c65746f6e20616464726573732070726f76696408c379a000000000000000000000000000000000000000000000000000000000a619486e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000acbe897875bb4f3e88089713fab44968f091fdeb912d0afadd2fe5700e4e0cc6',
    deployedBytecodeHash: '0x0100004124426fb9ebb25e27d670c068e52f9ba631bd383279a188be47e3f86d'
  }
}

export interface PredictSafeAddressProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
  isL1SafeMasterCopy?: boolean
  customContracts?: ContractNetworkConfig
}

export interface encodeSetupCallDataProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeContract: SafeContract
  customContracts?: ContractNetworkConfig
  customSafeVersion?: SafeVersion
}

export function encodeCreateProxyWithNonce(
  safeProxyFactoryContract: SafeProxyFactoryContract,
  safeSingletonAddress: string,
  initializer: string
) {
  return safeProxyFactoryContract.encode('createProxyWithNonce', [
    safeSingletonAddress,
    initializer,
    PREDETERMINED_SALT_NONCE
  ])
}

const memoizedGetCompatibilityFallbackHandlerContract = createMemoizedFunction(
  getCompatibilityFallbackHandlerContract
)

export async function encodeSetupCallData({
  ethAdapter,
  safeAccountConfig,
  safeContract,
  customContracts,
  customSafeVersion
}: encodeSetupCallDataProps): Promise<string> {
  const {
    owners,
    threshold,
    to = ZERO_ADDRESS,
    data = EMPTY_DATA,
    fallbackHandler,
    paymentToken = ZERO_ADDRESS,
    payment = 0,
    paymentReceiver = ZERO_ADDRESS
  } = safeAccountConfig

  const safeVersion = customSafeVersion || (await safeContract.getVersion())

  if (semverSatisfies(safeVersion, '<=1.0.0')) {
    return safeContract.encode('setup', [
      owners,
      threshold,
      to,
      data,
      paymentToken,
      payment,
      paymentReceiver
    ])
  }

  let fallbackHandlerAddress = fallbackHandler
  const isValidAddress = fallbackHandlerAddress !== undefined && isAddress(fallbackHandlerAddress)
  if (!isValidAddress) {
    const fallbackHandlerContract = await memoizedGetCompatibilityFallbackHandlerContract({
      ethAdapter,
      safeVersion,
      customContracts
    })

    fallbackHandlerAddress = fallbackHandlerContract.getAddress()
  }

  return safeContract.encode('setup', [
    owners,
    threshold,
    to,
    data,
    fallbackHandlerAddress,
    paymentToken,
    payment,
    paymentReceiver
  ])
}

const memoizedGetProxyFactoryContract = createMemoizedFunction(getProxyFactoryContract)
const memoizedGetSafeContract = createMemoizedFunction(getSafeContract)
const memoizedGetProxyCreationCode = createMemoizedFunction(
  async ({
    ethAdapter,
    safeVersion,
    customContracts
  }: {
    ethAdapter: EthAdapter
    safeVersion: SafeVersion
    customContracts?: ContractNetworkConfig
  }) => {
    const safeProxyFactoryContract = await memoizedGetProxyFactoryContract({
      ethAdapter,
      safeVersion,
      customContracts
    })

    return safeProxyFactoryContract.proxyCreationCode()
  }
)

export async function predictSafeAddress({
  ethAdapter,
  safeAccountConfig,
  safeDeploymentConfig = {},
  isL1SafeMasterCopy = false,
  customContracts
}: PredictSafeAddressProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const { safeVersion = DEFAULT_SAFE_VERSION, saltNonce = PREDETERMINED_SALT_NONCE } =
    safeDeploymentConfig

  const safeProxyFactoryContract = await memoizedGetProxyFactoryContract({
    ethAdapter,
    safeVersion,
    customContracts
  })

  const proxyCreationCode = await memoizedGetProxyCreationCode({
    ethAdapter,
    safeVersion,
    customContracts
  })

  const safeContract = await memoizedGetSafeContract({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    customContracts
  })

  const initializer = await encodeSetupCallData({
    ethAdapter,
    safeAccountConfig,
    safeContract,
    customContracts,
    customSafeVersion: safeVersion // it is more efficient if we provide the safeVersion manually
  })

  const encodedNonce = toBuffer(ethAdapter.encodeParameters(['uint256'], [saltNonce])).toString(
    'hex'
  )

  const salt = keccak256(
    toBuffer('0x' + keccak256(toBuffer(initializer)).toString('hex') + encodedNonce)
  )

  const input = ethAdapter.encodeParameters(['address'], [safeContract.getAddress()])

  const chainId = await ethAdapter.getChainId()
  // zkSync Era counterfactual deployment is calculated differently
  // https://era.zksync.io/docs/reference/architecture/differences-with-ethereum.html#create-create2
  if ([ZKSYNC_MAINNET, ZKSYNC_TESTNET].includes(chainId)) {
    const bytecodeHash = ZKSYNC_DEPLOYED_BYTECODE[safeVersion].deployedBytecodeHash
    return zkSyncUtils.create2Address(
      safeProxyFactoryContract.getAddress(),
      bytecodeHash,
      salt,
      input
    )
  }

  const constructorData = toBuffer(input).toString('hex')

  const initCode = proxyCreationCode + constructorData

  const proxyAddress =
    '0x' +
    generateAddress2(
      toBuffer(safeProxyFactoryContract.getAddress()),
      toBuffer(salt),
      toBuffer(initCode)
    ).toString('hex')

  return ethAdapter.getChecksummedAddress(proxyAddress)
}

export const validateSafeAccountConfig = ({ owners, threshold }: SafeAccountConfig): void => {
  if (owners.length <= 0) throw new Error('Owner list must have at least one owner')
  if (threshold <= 0) throw new Error('Threshold must be greater than or equal to 1')
  if (threshold > owners.length)
    throw new Error('Threshold must be lower than or equal to owners length')
}

export const validateSafeDeploymentConfig = ({ saltNonce }: SafeDeploymentConfig): void => {
  if (saltNonce && BigNumber.from(saltNonce).lt(0))
    throw new Error('saltNonce must be greater than or equal to 0')
}
