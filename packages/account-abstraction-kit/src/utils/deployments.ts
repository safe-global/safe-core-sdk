import {
  DeploymentFilter,
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment
} from '@safe-global/safe-deployments'
import { ethers } from 'ethers'
import { GnosisSafe__factory } from '../../typechain/factories'
import { MultiSendCallOnly__factory } from '../../typechain/factories/libraries'
import { GnosisSafeProxyFactory__factory } from '../../typechain/factories/proxies'
import { GnosisSafe } from '../../typechain/GnosisSafe'
import { MultiSendCallOnly } from './../../typechain/libraries/MultiSendCallOnly'
import { GnosisSafeProxyFactory } from './../../typechain/proxies/GnosisSafeProxyFactory'

export const safeDeploymentsL1ChainIds: number[] = [
  1 // Ethereum Mainnet
]

export function getSafeContract(
  chainId: number,
  signer: ethers.Signer,
  isL1SafeMasterCopy = false
): GnosisSafe {
  const filters: DeploymentFilter = {
    version: '1.3.0', // Only Safe v1.3.0 supported so far
    network: chainId.toString(),
    released: true
  }
  const contractDeployment =
    safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeMasterCopy
      ? getSafeSingletonDeployment(filters)
      : getSafeL2SingletonDeployment(filters)
  const contractAddress = contractDeployment?.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid SafeProxy contract address')
  }
  const contract = GnosisSafe__factory.connect(contractAddress, signer)
  return contract
}

export function getSafeProxyFactoryContract(
  chainId: number,
  signer: ethers.Signer
): GnosisSafeProxyFactory {
  const contractDeployment = getProxyFactoryDeployment({
    version: '1.3.0', // Only Safe v1.3.0 supported so far
    network: chainId.toString(),
    released: true
  })
  const contractAddress = contractDeployment?.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid SafeProxyFactory contract address')
  }
  const contract = GnosisSafeProxyFactory__factory.connect(contractAddress, signer)
  return contract
}

export function getMultiSendCallOnlyContract(
  chainId: number,
  signer: ethers.Signer
): MultiSendCallOnly {
  const contractDeployment = getMultiSendCallOnlyDeployment({
    version: '1.3.0', // Only Safe v1.3.0 supported so far
    network: chainId.toString(),
    released: true
  })
  const contractAddress = contractDeployment?.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid MultiSendCallOnly contract address')
  }
  const contract = MultiSendCallOnly__factory.connect(contractAddress, signer)
  return contract
}

export function getCompatibilityFallbackHandlerAddress(chainId: number): string {
  const contractDeployment = getCompatibilityFallbackHandlerDeployment({
    version: '1.3.0', // Only Safe v1.3.0 supported so far
    network: chainId.toString(),
    released: true
  })
  const contractAddress = contractDeployment?.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid CompatibilityFallbackHandler contract address')
  }
  return contractAddress
}
