import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getCreateCallContractInstance,
  getMultiSendCallOnlyContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSafeWebAuthnSharedSignerContractInstance,
  getSafeWebAuthnSignerFactoryContractInstance,
  getSignMessageLibContractInstance,
  getSimulateTxAccessorContractInstance
} from '@safe-global/protocol-kit/contracts/contractInstances'
import {
  CompatibilityFallbackHandlerContractImplementationType,
  ContractNetworkConfig,
  CreateCallContractImplementationType,
  DeploymentType,
  MultiSendCallOnlyContractImplementationType,
  MultiSendContractImplementationType,
  SafeContractImplementationType,
  SafeProxyFactoryContractImplementationType,
  SafeWebAuthnSharedSignerContractImplementationType,
  SafeWebAuthnSignerFactoryContractImplementationType,
  SignMessageLibContractImplementationType,
  SimulateTxAccessorContractImplementationType
} from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/types-kit'

export interface GetContractInstanceProps {
  safeProvider: SafeProvider
  safeVersion: SafeVersion
  customContracts?: ContractNetworkConfig
  deploymentType?: DeploymentType
}

export interface GetSafeContractInstanceProps extends GetContractInstanceProps {
  isL1SafeSingleton?: boolean
  customSafeAddress?: string
}

export async function getSafeContract({
  safeProvider,
  safeVersion,
  customSafeAddress,
  isL1SafeSingleton,
  customContracts,
  deploymentType
}: GetSafeContractInstanceProps): Promise<SafeContractImplementationType> {
  const safeContract = await getSafeContractInstance(
    safeVersion,
    safeProvider,
    customSafeAddress ?? customContracts?.safeSingletonAddress,
    customContracts?.safeSingletonAbi,
    isL1SafeSingleton,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(safeContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('SafeProxy contract is not deployed on the current network')
  }
  return safeContract
}

export async function getSafeProxyFactoryContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<SafeProxyFactoryContractImplementationType> {
  const safeProxyFactoryContract = await getSafeProxyFactoryContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.safeProxyFactoryAddress,
    customContracts?.safeProxyFactoryAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    safeProxyFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SafeProxyFactory contract is not deployed on the current network')
  }
  return safeProxyFactoryContract
}

export async function getCompatibilityFallbackHandlerContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<CompatibilityFallbackHandlerContractImplementationType> {
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.fallbackHandlerAddress,
    customContracts?.fallbackHandlerAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    fallbackHandlerContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CompatibilityFallbackHandler contract is not deployed on the current network')
  }
  return fallbackHandlerContract
}

export async function getMultiSendContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<MultiSendContractImplementationType> {
  const multiSendContract = await getMultiSendContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.multiSendAddress,
    customContracts?.multiSendAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(multiSendContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('MultiSend contract is not deployed on the current network')
  }
  return multiSendContract
}

export async function getMultiSendCallOnlyContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<MultiSendCallOnlyContractImplementationType> {
  const multiSendCallOnlyContract = await getMultiSendCallOnlyContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.multiSendCallOnlyAddress,
    customContracts?.multiSendCallOnlyAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    multiSendCallOnlyContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSendCallOnly contract is not deployed on the current network')
  }
  return multiSendCallOnlyContract
}

export async function getSignMessageLibContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<SignMessageLibContractImplementationType> {
  const signMessageLibContract = await getSignMessageLibContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.signMessageLibAddress,
    customContracts?.signMessageLibAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    signMessageLibContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SignMessageLib contract is not deployed on the current network')
  }
  return signMessageLibContract
}

export async function getCreateCallContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<CreateCallContractImplementationType> {
  const createCallContract = await getCreateCallContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.createCallAddress,
    customContracts?.createCallAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(createCallContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('CreateCall contract is not deployed on the current network')
  }
  return createCallContract
}

export async function getSimulateTxAccessorContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<SimulateTxAccessorContractImplementationType> {
  const simulateTxAccessorContract = await getSimulateTxAccessorContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.simulateTxAccessorAddress,
    customContracts?.simulateTxAccessorAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    simulateTxAccessorContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SimulateTxAccessor contract is not deployed on the current network')
  }
  return simulateTxAccessorContract
}

export async function getSafeWebAuthnSignerFactoryContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<SafeWebAuthnSignerFactoryContractImplementationType> {
  const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.safeWebAuthnSignerFactoryAddress,
    customContracts?.safeWebAuthnSignerFactoryAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    safeWebAuthnSignerFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('safeWebAuthnSignerFactory contract is not deployed on the current network')
  }
  return safeWebAuthnSignerFactoryContract
}

export async function getSafeWebAuthnSharedSignerContract({
  safeProvider,
  safeVersion,
  customContracts,
  deploymentType
}: GetContractInstanceProps): Promise<SafeWebAuthnSharedSignerContractImplementationType> {
  const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContractInstance(
    safeVersion,
    safeProvider,
    customContracts?.safeWebAuthnSharedSignerAddress,
    customContracts?.safeWebAuthnSharedSignerAbi,
    deploymentType
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    safeWebAuthnSharedSignerContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('safeWebAuthnSharedSigner contract is not deployed on the current network')
  }
  return safeWebAuthnSharedSignerContract
}
