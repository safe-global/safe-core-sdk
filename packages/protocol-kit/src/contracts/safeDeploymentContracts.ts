import { ContractNetworkConfig } from '@safe-global/protocol-kit/types'
import {
  CompatibilityFallbackHandlerContract,
  CreateCallContract,
  ISafeProvider,
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeContract,
  SafeProxyFactoryContract,
  SafeVersion,
  SignMessageLibContract,
  SimulateTxAccessorContract
} from '@safe-global/safe-core-sdk-types'
import {
  DeploymentFilter,
  SingletonDeployment,
  getCompatibilityFallbackHandlerDeployment,
  getCreateCallDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  getSignMessageLibDeployment,
  getSimulateTxAccessorDeployment
} from '@safe-global/safe-deployments'
import { safeDeploymentsL1ChainIds, safeDeploymentsVersions } from './config'

export interface GetContractInstanceProps {
  safeProvider: ISafeProvider
  safeVersion: SafeVersion
  customContracts?: ContractNetworkConfig
}

export interface GetSafeContractInstanceProps extends GetContractInstanceProps {
  isL1SafeSingleton?: boolean
  customSafeAddress?: string
}

export function getSafeContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint,
  isL1SafeSingleton = false
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeSingletonVersion
  const filters: DeploymentFilter = { version, network: chainId.toString(), released: true }
  if (safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeSingleton) {
    return getSafeSingletonDeployment(filters)
  }
  return getSafeL2SingletonDeployment(filters)
}

export function getCompatibilityFallbackHandlerContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].compatibilityFallbackHandler
  return getCompatibilityFallbackHandlerDeployment({
    version,
    network: chainId.toString(),
    released: true
  })
}

export function getMultiSendCallOnlyContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].multiSendCallOnlyVersion
  return getMultiSendCallOnlyDeployment({ version, network: chainId.toString(), released: true })
}

export function getMultiSendContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].multiSendVersion
  return getMultiSendDeployment({ version, network: chainId.toString(), released: true })
}

export function getSafeProxyFactoryContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeProxyFactoryVersion
  return getProxyFactoryDeployment({ version, network: chainId.toString(), released: true })
}

export function getSignMessageLibContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].signMessageLibVersion
  return getSignMessageLibDeployment({ version, network: chainId.toString(), released: true })
}

export function getCreateCallContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].createCallVersion
  return getCreateCallDeployment({ version, network: chainId.toString(), released: true })
}

export function getSimulateTxAccessorContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].createCallVersion
  return getSimulateTxAccessorDeployment({ version, network: chainId.toString(), released: true })
}

export async function getSafeContract({
  safeProvider,
  safeVersion,
  customSafeAddress,
  isL1SafeSingleton,
  customContracts
}: GetSafeContractInstanceProps): Promise<SafeContract> {
  const chainId = await safeProvider.getChainId()
  const singletonDeployment = getSafeContractDeployment(safeVersion, chainId, isL1SafeSingleton)
  const safeContract = await safeProvider.getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress: customSafeAddress ?? customContracts?.safeSingletonAddress,
    customContractAbi: customContracts?.safeSingletonAbi,
    isL1SafeSingleton
  })
  const isContractDeployed = await safeProvider.isContractDeployed(await safeContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('SafeProxy contract is not deployed on the current network')
  }
  return safeContract
}

export async function getProxyFactoryContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SafeProxyFactoryContract> {
  const chainId = await safeProvider.getChainId()
  const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
  const safeProxyFactoryContract = await safeProvider.getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment: proxyFactoryDeployment,
    customContractAddress: customContracts?.safeProxyFactoryAddress,
    customContractAbi: customContracts?.safeProxyFactoryAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await safeProxyFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SafeProxyFactory contract is not deployed on the current network')
  }
  return safeProxyFactoryContract
}

export async function getCompatibilityFallbackHandlerContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<CompatibilityFallbackHandlerContract> {
  const chainId = await safeProvider.getChainId()
  const fallbackHandlerDeployment = getCompatibilityFallbackHandlerContractDeployment(
    safeVersion,
    chainId
  )
  const fallbackHandlerContract = await safeProvider.getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment: fallbackHandlerDeployment,
    customContractAddress: customContracts?.fallbackHandlerAddress,
    customContractAbi: customContracts?.fallbackHandlerAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await fallbackHandlerContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CompatibilityFallbackHandler contract is not deployed on the current network')
  }
  return fallbackHandlerContract
}

export async function getMultiSendContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendContract> {
  const chainId = await safeProvider.getChainId()
  const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
  const multiSendContract = await safeProvider.getMultiSendContract({
    safeVersion,
    singletonDeployment: multiSendDeployment,
    customContractAddress: customContracts?.multiSendAddress,
    customContractAbi: customContracts?.multiSendAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await multiSendContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSend contract is not deployed on the current network')
  }
  return multiSendContract
}

export async function getMultiSendCallOnlyContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendCallOnlyContract> {
  const chainId = await safeProvider.getChainId()
  const multiSendCallOnlyDeployment = getMultiSendCallOnlyContractDeployment(safeVersion, chainId)
  const multiSendCallOnlyContract = await safeProvider.getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment: multiSendCallOnlyDeployment,
    customContractAddress: customContracts?.multiSendCallOnlyAddress,
    customContractAbi: customContracts?.multiSendCallOnlyAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await multiSendCallOnlyContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSendCallOnly contract is not deployed on the current network')
  }
  return multiSendCallOnlyContract
}

export async function getSignMessageLibContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SignMessageLibContract> {
  const chainId = await safeProvider.getChainId()
  const signMessageLibDeployment = getSignMessageLibContractDeployment(safeVersion, chainId)
  const signMessageLibContract = await safeProvider.getSignMessageLibContract({
    safeVersion,
    singletonDeployment: signMessageLibDeployment,
    customContractAddress: customContracts?.signMessageLibAddress,
    customContractAbi: customContracts?.signMessageLibAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await signMessageLibContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SignMessageLib contract is not deployed on the current network')
  }
  return signMessageLibContract
}

export async function getCreateCallContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<CreateCallContract> {
  const chainId = await safeProvider.getChainId()
  const createCallDeployment = getCreateCallContractDeployment(safeVersion, chainId)
  const createCallContract = await safeProvider.getCreateCallContract({
    safeVersion,
    singletonDeployment: createCallDeployment,
    customContractAddress: customContracts?.createCallAddress,
    customContractAbi: customContracts?.createCallAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await createCallContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CreateCall contract is not deployed on the current network')
  }
  return createCallContract
}

export async function getSimulateTxAccessorContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SimulateTxAccessorContract> {
  const chainId = await safeProvider.getChainId()
  const simulateTxAccessorDeployment = getSimulateTxAccessorContractDeployment(safeVersion, chainId)
  const simulateTxAccessorContract = await safeProvider.getSimulateTxAccessorContract({
    safeVersion,
    singletonDeployment: simulateTxAccessorDeployment,
    customContractAddress: customContracts?.simulateTxAccessorAddress,
    customContractAbi: customContracts?.simulateTxAccessorAbi
  })
  const isContractDeployed = await safeProvider.isContractDeployed(
    await simulateTxAccessorContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SimulateTxAccessor contract is not deployed on the current network')
  }
  return simulateTxAccessorContract
}
