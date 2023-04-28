import { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { BigNumberish, BytesLike, ethers } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import {
  getCompatibilityFallbackHandlerContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import { ContractNetworkConfig, SafeAccountConfig } from '../types'
import { ZERO_ADDRESS } from '../utils/constants'

// keccak256(toUtf8Bytes('Safe Account Abstraction'))
export const PREDETERMINED_SALT_NONCE =
  '0xb1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f90'

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

// TO-DO: Merge with encodeSetupCallData from the SafeFactory class
export async function encodeDefaultSetupCallData(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeContract: GnosisSafeContract,
  safeAccountConfig: SafeAccountConfig,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  if (semverSatisfies(safeVersion, '<=1.0.0')) {
    return safeContract.encode('setup', [
      safeAccountConfig.owners, // required
      safeAccountConfig.threshold as BigNumberish, // required
      safeAccountConfig.to || ZERO_ADDRESS,
      (safeAccountConfig.data as BytesLike) || '0x',
      safeAccountConfig.paymentToken || ZERO_ADDRESS,
      (safeAccountConfig.payment as BigNumberish) || 0,
      safeAccountConfig.paymentReceiver || ZERO_ADDRESS
    ])
  }
  let fallbackHandlerAddress = safeAccountConfig.fallbackHandler
  if (!fallbackHandlerAddress) {
    const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
    fallbackHandlerAddress = fallbackHandlerContract.getAddress()
  }

  return safeContract.encode('setup', [
    safeAccountConfig.owners, // required
    safeAccountConfig.threshold as BigNumberish, // required
    safeAccountConfig.to || ZERO_ADDRESS,
    (safeAccountConfig.data as BytesLike) || '0x',
    fallbackHandlerAddress,
    safeAccountConfig.paymentToken || ZERO_ADDRESS,
    (safeAccountConfig.payment as BigNumberish) || 0,
    safeAccountConfig.paymentReceiver || ZERO_ADDRESS
  ])
}

export async function getSafeInitializer(
  ethAdapter: EthAdapter,
  safeContract: GnosisSafeContract,
  predictedSafe: PredictedSafeProps,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  const safeVersion = await safeContract.getVersion()
  const initializer = await encodeDefaultSetupCallData(
    ethAdapter,
    safeVersion,
    safeContract,
    predictedSafe.safeAccountConfig,
    customContracts
  )

  return initializer
}

export async function calculateProxyAddress(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeProxyFactoryContract: GnosisSafeProxyFactoryContract,
  predictedSafe: PredictedSafeProps,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    customContracts
  })
  const deployer = safeProxyFactoryContract.getAddress()

  const deploymentCode = ethers.utils.solidityPack(
    ['bytes', 'uint256'],
    [await safeProxyFactoryContract.proxyCreationCode(), safeSingletonContract.getAddress()]
  )
  const salt = ethers.utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [
      ethers.utils.solidityKeccak256(
        ['bytes'],
        [
          await getSafeInitializer(
            ethAdapter,
            safeSingletonContract,
            predictedSafe,
            customContracts
          )
        ]
      ),
      predictedSafe.safeDeploymentConfig.saltNonce || PREDETERMINED_SALT_NONCE
    ]
  )

  const derivedAddress = ethers.utils.getCreate2Address(
    deployer,
    salt,
    ethers.utils.keccak256(deploymentCode)
  )
  return derivedAddress
}
