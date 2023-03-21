import {
  DeploymentFilter,
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment
} from '@safe-global/safe-deployments'
import { Gnosis_safe__factory as GnosisSafe__factory } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/factories/Gnosis_safe__factory'
import { Multi_send_call_only__factory as MultiSendCallOnly__factory } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/factories/Multi_send_call_only__factory'
import { Proxy_factory__factory as GnosisSafeProxyFactory__factory } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/factories/Proxy_factory__factory'
import { Gnosis_safe as GnosisSafe } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/Gnosis_safe'
import { Multi_send_call_only as MultiSendCallOnly } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/Multi_send_call_only'
import { Proxy_factory as GnosisSafeProxyFactory } from '@safe-global/safe-ethers-lib/typechain/src/ethers-v5/v1.3.0/Proxy_factory'
import { ethers } from 'ethers'

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
