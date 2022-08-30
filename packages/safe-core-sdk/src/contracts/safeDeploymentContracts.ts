import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeVersion
} from '@gnosis.pm/safe-core-sdk-types'
import {
  DeploymentFilter,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  SingletonDeployment
} from '@gnosis.pm/safe-deployments'
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
    customContractAddress: customContracts?.multiSendAddress,
    customContractAbi: customContracts?.multiSendAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    multiSendCallOnlyContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSendCallOnly contract is not deployed on the current network')
  }
  return multiSendCallOnlyContract
}
