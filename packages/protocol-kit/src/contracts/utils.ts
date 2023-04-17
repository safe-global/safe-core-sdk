import { EthAdapter, GnosisSafeContract, SafeVersion } from '@safe-global/safe-core-sdk-types'
import semverSatisfies from 'semver/functions/satisfies'
import { generateAddress2, keccak256, toBuffer } from 'ethereumjs-util'
import { SafeAccountConfig, SafeDeploymentConfig } from '@safe-global/protocol-kit/safeFactory'
import {
  validateSafeAccountConfig,
  validateSafeDeploymentConfig
} from '@safe-global/protocol-kit/safeFactory/utils'
import { SAFE_LAST_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getCompatibilityFallbackHandlerContract,
  getProxyFactoryContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { ContractNetworkConfig } from '@safe-global/protocol-kit/types'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

export interface PredictSafeProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig: SafeDeploymentConfig
  safeVersion?: SafeVersion
  isL1SafeMasterCopy?: boolean
  customContracts?: ContractNetworkConfig
}

export interface encodeSetupCallDataProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeContract: GnosisSafeContract
  safeVersion?: SafeVersion
  customContracts?: ContractNetworkConfig
}

export async function encodeSetupCallData({
  ethAdapter,
  safeAccountConfig,
  safeContract,
  safeVersion = SAFE_LAST_VERSION,
  customContracts
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

  const customFallbackHandler = !!fallbackHandler

  if (customFallbackHandler) {
    return safeContract.encode('setup', [
      owners,
      threshold,
      to,
      data,
      fallbackHandler,
      paymentToken,
      payment,
      paymentReceiver
    ])
  }

  const chainId = await ethAdapter.getChainId()
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    ethAdapter,
    safeVersion,
    chainId,
    customContracts
  })

  const fallbackHandlerAddress = fallbackHandlerContract.getAddress()

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

export async function predictSafeAddress({
  ethAdapter,
  safeAccountConfig,
  safeDeploymentConfig,
  safeVersion = SAFE_LAST_VERSION,
  isL1SafeMasterCopy = false,
  customContracts
}: PredictSafeProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const chainId = await ethAdapter.getChainId()
  const { saltNonce } = safeDeploymentConfig

  const safeProxyFactoryContract = await getProxyFactoryContract({
    ethAdapter,
    safeVersion,
    chainId,
    customContracts
  })

  const proxyCreationCode = await safeProxyFactoryContract.proxyCreationCode()

  const safeContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    chainId,
    isL1SafeMasterCopy,
    customContracts
  })

  const initializer = await encodeSetupCallData({
    ethAdapter,
    safeAccountConfig,
    safeContract,
    safeVersion,
    customContracts
  })

  const encodedNonce = toBuffer(ethAdapter.encodeParameters(['uint256'], [saltNonce])).toString(
    'hex'
  )

  const salt = keccak256(
    toBuffer('0x' + keccak256(toBuffer(initializer)).toString('hex') + encodedNonce)
  )

  const constructorData = toBuffer(
    ethAdapter.encodeParameters(['address'], [safeContract.getAddress()])
  ).toString('hex')

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
