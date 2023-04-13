import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { BigNumber, BigNumberish, BytesLike, ethers } from 'ethers'
import {
  getCompatibilityFallbackHandlerContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import { ContractNetworkConfig } from '../types'
import { ZERO_ADDRESS } from '../utils/constants'

// keccak256(toUtf8Bytes('Safe Account Abstraction'))
export const PREDETERMINED_SALT_NONCE =
  '0xb1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f90'

// TO-DO: Merge with encodeSetupCallData from the SafeFactory class
export async function encodeDefaultSetupCallData(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeContract: GnosisSafeContract,
  owners: string[],
  chainId: number,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  const compatibilityFallbackHandler = await getCompatibilityFallbackHandlerContract({
    ethAdapter,
    safeVersion,
    chainId,
    customContracts
  })

  return safeContract.encode('setup', [
    owners,
    BigNumber.from(1) as BigNumberish,
    ZERO_ADDRESS,
    '0x' as BytesLike,
    compatibilityFallbackHandler.getAddress(),
    ZERO_ADDRESS,
    BigNumber.from(0) as BigNumberish,
    ZERO_ADDRESS
  ])
}

export async function getSafeInitializer(
  ethAdapter: EthAdapter,
  safeContract: GnosisSafeContract,
  signerAddress: string,
  chainId: number,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  const safeVersion = await safeContract.getVersion()
  const initializer = await encodeDefaultSetupCallData(
    ethAdapter,
    safeVersion,
    safeContract,
    [signerAddress],
    chainId,
    customContracts
  )

  return initializer
}

export async function calculateProxyAddress(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeProxyFactoryContract: GnosisSafeProxyFactoryContract,
  signerAddress: string,
  customContracts?: ContractNetworkConfig
): Promise<string> {
  const chainId = await ethAdapter.getChainId()
  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    chainId,
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
            signerAddress,
            chainId,
            customContracts
          )
        ]
      ),
      PREDETERMINED_SALT_NONCE
    ]
  )
  const derivedAddress = ethers.utils.getCreate2Address(
    deployer,
    salt,
    ethers.utils.keccak256(deploymentCode)
  )
  return derivedAddress
}
