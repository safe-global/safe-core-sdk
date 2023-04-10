import { BigNumber } from '@ethersproject/bignumber'
import { BytesLike } from '@ethersproject/bytes'
import { getCompatibilityFallbackHandlerContract, getSafeContract } from '@safe-global/protocol-kit'
import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { BigNumberish, ethers, Signer } from 'ethers'
import {
  PREDETERMINED_SALT_NONCE,
  ZERO_ADDRESS
} from '@safe-global/account-abstraction-kit-poc/constants'

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

async function encodeSetupCallData(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeContract: GnosisSafeContract,
  owners: string[],
  chainId: number
): Promise<string> {
  const compatibilityFallbackhandlerAddress = await getCompatibilityFallbackHandlerContract({
    ethAdapter,
    safeVersion,
    chainId
  })
  return safeContract.encode('setup', [
    owners,
    BigNumber.from(1) as BigNumberish,
    ZERO_ADDRESS,
    '0x' as BytesLike,
    compatibilityFallbackhandlerAddress,
    ZERO_ADDRESS,
    BigNumber.from(0) as BigNumberish,
    ZERO_ADDRESS
  ])
}

export async function getSafeInitializer(
  ethAdapter: EthAdapter,
  safeContract: GnosisSafeContract,
  signerAddress: string,
  chainId: number
): Promise<string> {
  const safeVersion = await safeContract.getVersion()
  const initializer = await encodeSetupCallData(
    ethAdapter,
    safeVersion,
    safeContract,
    [signerAddress],
    chainId
  )
  return initializer
}

export async function calculateChainSpecificProxyAddress(
  ethAdapter: EthAdapter,
  safeVersion: SafeVersion,
  safeProxyFactoryContract: GnosisSafeProxyFactoryContract,
  signer: Signer
): Promise<string> {
  const chainId = await ethAdapter.getChainId()
  const safeSingletonContract = await getSafeContract({ ethAdapter, safeVersion, chainId })
  const deployer = safeProxyFactoryContract.getAddress()
  const signerAddress = await signer.getAddress()

  const deploymentCode = ethers.utils.solidityPack(
    ['bytes', 'uint256'],
    [safeProxyFactoryContract.proxyCreationCode(), safeSingletonContract.getAddress()]
  )
  const salt = ethers.utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [
      ethers.utils.solidityKeccak256(
        ['bytes'],
        [await getSafeInitializer(ethAdapter, safeSingletonContract, signerAddress, chainId)]
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
