import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract
} from '@safe-global/safe-core-sdk-types'
import { generateAddress2, keccak256, toBuffer } from 'ethereumjs-util'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import semverSatisfies from 'semver/functions/satisfies'
import {
  getCompatibilityFallbackHandlerContract,
  getProxyFactoryContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import { ContractNetworkConfig, SafeAccountConfig, SafeDeploymentConfig } from '../types'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { SAFE_LAST_VERSION } from '@safe-global/protocol-kit/contracts/config'

// keccak256(toUtf8Bytes('Safe Account Abstraction'))
export const PREDETERMINED_SALT_NONCE =
  '0xb1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f90'

export interface PredictSafeProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig: SafeDeploymentConfig
  isL1SafeMasterCopy?: boolean
  customContracts?: ContractNetworkConfig
}

export interface encodeSetupCallDataProps {
  ethAdapter: EthAdapter
  safeAccountConfig: SafeAccountConfig
  safeContract: GnosisSafeContract
  customContracts?: ContractNetworkConfig
}

export function encodeCreateProxyWithNonce(
  safeProxyFactoryContract: GnosisSafeProxyFactoryContract,
  safeSingletonAddress: string,
  initializer: string
) {
  return safeProxyFactoryContract.encode('createProxyWithNonce', [
    safeSingletonAddress,
    initializer,
    PREDETERMINED_SALT_NONCE
  ])
}

export async function encodeSetupCallData({
  ethAdapter,
  safeAccountConfig,
  safeContract,
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

  const safeVersion = await safeContract.getVersion()

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
    const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
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

export async function predictSafeAddress({
  ethAdapter,
  safeAccountConfig,
  safeDeploymentConfig,
  isL1SafeMasterCopy = false,
  customContracts
}: PredictSafeProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const { safeVersion = SAFE_LAST_VERSION, saltNonce = PREDETERMINED_SALT_NONCE } =
    safeDeploymentConfig

  const safeProxyFactoryContract = await getProxyFactoryContract({
    ethAdapter,
    safeVersion,
    customContracts
  })

  const proxyCreationCode = await safeProxyFactoryContract.proxyCreationCode()

  const safeContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    customContracts
  })

  const initializer = await encodeSetupCallData({
    ethAdapter,
    safeAccountConfig,
    safeContract,
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
