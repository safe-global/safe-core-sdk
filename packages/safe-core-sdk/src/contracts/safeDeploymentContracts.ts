import {
  DeploymentFilter,
  getCompatibilityFallbackHandlerDeployment,
  getCreateCallDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  getSignMessageLibDeployment,
  SingletonDeployment
} from '@gnosis.pm/safe-deployments'
import {
  CompatibilityFallbackHandlerContract,
  CreateCallContract,
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeVersion,
  SignMessageLibContract
} from '@safe-global/safe-core-sdk-types'
import { ContractNetworkConfig } from '../types'
import { safeDeploymentsL1ChainIds, safeDeploymentsVersions } from './config'

interface GetContractInstanceProps {
  ethAdapter: EthAdapter
  safeVersion: SafeVersion
  chainId: number
  customContracts?: ContractNetworkConfig
}

interface GetSafeContractInstanceProps extends GetContractInstanceProps {
  isL1SafeMasterCopy?: boolean
  customSafeAddress?: string
}

export function getSafeContractDeployment(
  safeVersion: SafeVersion,
  chainId: number,
  isL1SafeMasterCopy: boolean = false
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeMasterCopyVersion
  const filters: DeploymentFilter = { version, network: chainId.toString(), released: true }
  if (safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeMasterCopy) {
    return getSafeSingletonDeployment(filters)
  }
  return getSafeL2SingletonDeployment(filters)
}

export function getCompatibilityFallbackHandlerContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
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
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].multiSendCallOnlyVersion
  return getMultiSendCallOnlyDeployment({ version, network: chainId.toString(), released: true })
}

export function getMultiSendContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].multiSendVersion
  return getMultiSendDeployment({ version, network: chainId.toString(), released: true })
}

export function getSafeProxyFactoryContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeProxyFactoryVersion
  return getProxyFactoryDeployment({ version, network: chainId.toString(), released: true })
}

export function getSignMessageLibContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].signMessageLibVersion
  return getSignMessageLibDeployment({ version, network: chainId.toString(), released: true })
}

export function getCreateCallContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].createCallVersion
  return getCreateCallDeployment({ version, network: chainId.toString(), released: true })
}

export async function getSafeContract({
  ethAdapter,
  safeVersion,
  chainId,
  customSafeAddress,
  isL1SafeMasterCopy,
  customContracts
}: GetSafeContractInstanceProps): Promise<GnosisSafeContract> {
  const singletonDeployment = getSafeContractDeployment(safeVersion, chainId, isL1SafeMasterCopy)
  const gnosisSafeContract = ethAdapter.getSafeContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress: customSafeAddress ?? customContracts?.safeMasterCopyAddress,
    customContractAbi: customContracts?.safeMasterCopyAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(gnosisSafeContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('SafeProxy contract is not deployed on the current network')
  }
  return gnosisSafeContract
}

export async function getProxyFactoryContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<GnosisSafeProxyFactoryContract> {
  const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
  const safeProxyFactoryContract = await ethAdapter.getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    singletonDeployment: proxyFactoryDeployment,
    customContractAddress: customContracts?.safeProxyFactoryAddress,
    customContractAbi: customContracts?.safeProxyFactoryAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    safeProxyFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SafeProxyFactory contract is not deployed on the current network')
  }
  return safeProxyFactoryContract
}

export async function getCompatibilityFallbackHandlerContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<CompatibilityFallbackHandlerContract> {
  const fallbackHandlerDeployment = getCompatibilityFallbackHandlerContractDeployment(
    safeVersion,
    chainId
  )
  const fallbackHandlerContract = await ethAdapter.getCompatibilityFallbackHandlerContract({
    safeVersion,
    chainId,
    singletonDeployment: fallbackHandlerDeployment,
    customContractAddress: customContracts?.fallbackHandlerAddress,
    customContractAbi: customContracts?.fallbackHandlerAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    fallbackHandlerContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CompatibilityFallbackHandler contract is not deployed on the current network')
  }
  return fallbackHandlerContract
}

export async function getMultiSendContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendContract> {
  const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
  const multiSendContract = await ethAdapter.getMultiSendContract({
    safeVersion,
    chainId,
    singletonDeployment: multiSendDeployment,
    customContractAddress: customContracts?.multiSendAddress,
    customContractAbi: customContracts?.multiSendAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(multiSendContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('MultiSend contract is not deployed on the current network')
  }
  return multiSendContract
}

export async function getMultiSendCallOnlyContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendCallOnlyContract> {
  const multiSendCallOnlyDeployment = getMultiSendCallOnlyContractDeployment(safeVersion, chainId)
  const multiSendCallOnlyContract = await ethAdapter.getMultiSendCallOnlyContract({
    safeVersion,
    chainId,
    singletonDeployment: multiSendCallOnlyDeployment,
    customContractAddress: customContracts?.multiSendCallOnlyAddress,
    customContractAbi: customContracts?.multiSendCallOnlyAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    multiSendCallOnlyContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSendCallOnly contract is not deployed on the current network')
  }
  return multiSendCallOnlyContract
}

export async function getSignMessageLibContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<SignMessageLibContract> {
  const signMessageLibDeployment = getSignMessageLibContractDeployment(safeVersion, chainId)
  const signMessageLibContract = await ethAdapter.getSignMessageLibContract({
    safeVersion,
    chainId,
    singletonDeployment: signMessageLibDeployment,
    customContractAddress: customContracts?.signMessageLibAddress,
    customContractAbi: customContracts?.signMessageLibAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    signMessageLibContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SignMessageLib contract is not deployed on the current network')
  }
  return signMessageLibContract
}

export async function getCreateCallContract({
  ethAdapter,
  safeVersion,
  chainId,
  customContracts
}: GetContractInstanceProps): Promise<CreateCallContract> {
  const createCallDeployment = getCreateCallContractDeployment(safeVersion, chainId)
  const createCallContract = await ethAdapter.getCreateCallContract({
    safeVersion,
    chainId,
    singletonDeployment: createCallDeployment,
    customContractAddress: customContracts?.createCallAddress,
    customContractAbi: customContracts?.createCallAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(createCallContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('CreateCall contract is not deployed on the current network')
  }
  return createCallContract
}
