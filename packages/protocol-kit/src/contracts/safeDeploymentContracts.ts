import {
  CompatibilityFallbackHandlerContractImplementationType,
  ContractNetworkConfig,
  CreateCallContractImplementationType,
  MultiSendCallOnlyContractImplementationType,
  MultiSendContractImplementationType,
  SafeContractImplementationType,
  SafeProxyFactoryContractImplementationType,
  SignMessageLibContractImplementationType,
  SimulateTxAccessorContractImplementationType
} from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { EthAdapter } from '@safe-global/protocol-kit/adapters/ethAdapter'

export interface GetContractInstanceProps {
  ethAdapter: EthAdapter
  safeVersion: SafeVersion
  customContracts?: ContractNetworkConfig
}

export interface GetSafeContractInstanceProps extends GetContractInstanceProps {
  isL1SafeSingleton?: boolean
  customSafeAddress?: string
}

export async function getSafeContract({
  ethAdapter,
  safeVersion,
  customSafeAddress,
  isL1SafeSingleton,
  customContracts
}: GetSafeContractInstanceProps): Promise<SafeContractImplementationType> {
  const safeContract = await ethAdapter.getSafeContract({
    safeVersion,
    customContractAddress: customSafeAddress ?? customContracts?.safeSingletonAddress,
    customContractAbi: customContracts?.safeSingletonAbi,
    isL1SafeSingleton
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(await safeContract.getAddress())
  if (!isContractDeployed) {
    throw new Error('SafeProxy contract is not deployed on the current network')
  }
  return safeContract
}

export async function getProxyFactoryContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SafeProxyFactoryContractImplementationType> {
  const safeProxyFactoryContract = await ethAdapter.getSafeProxyFactoryContract({
    safeVersion,
    customContractAddress: customContracts?.safeProxyFactoryAddress,
    customContractAbi: customContracts?.safeProxyFactoryAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await safeProxyFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SafeProxyFactory contract is not deployed on the current network')
  }
  return safeProxyFactoryContract
}

export async function getCompatibilityFallbackHandlerContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<CompatibilityFallbackHandlerContractImplementationType> {
  const fallbackHandlerContract = await ethAdapter.getCompatibilityFallbackHandlerContract({
    safeVersion,
    customContractAddress: customContracts?.fallbackHandlerAddress,
    customContractAbi: customContracts?.fallbackHandlerAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await fallbackHandlerContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CompatibilityFallbackHandler contract is not deployed on the current network')
  }
  return fallbackHandlerContract
}

export async function getMultiSendContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendContractImplementationType> {
  const multiSendContract = await ethAdapter.getMultiSendContract({
    safeVersion,
    customContractAddress: customContracts?.multiSendAddress,
    customContractAbi: customContracts?.multiSendAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await multiSendContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSend contract is not deployed on the current network')
  }
  return multiSendContract
}

export async function getMultiSendCallOnlyContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<MultiSendCallOnlyContractImplementationType> {
  const multiSendCallOnlyContract = await ethAdapter.getMultiSendCallOnlyContract({
    safeVersion,
    customContractAddress: customContracts?.multiSendCallOnlyAddress,
    customContractAbi: customContracts?.multiSendCallOnlyAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await multiSendCallOnlyContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('MultiSendCallOnly contract is not deployed on the current network')
  }
  return multiSendCallOnlyContract
}

export async function getSignMessageLibContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SignMessageLibContractImplementationType> {
  const signMessageLibContract = await ethAdapter.getSignMessageLibContract({
    safeVersion,
    customContractAddress: customContracts?.signMessageLibAddress,
    customContractAbi: customContracts?.signMessageLibAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await signMessageLibContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SignMessageLib contract is not deployed on the current network')
  }
  return signMessageLibContract
}

export async function getCreateCallContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<CreateCallContractImplementationType> {
  const createCallContract = await ethAdapter.getCreateCallContract({
    safeVersion,
    customContractAddress: customContracts?.createCallAddress,
    customContractAbi: customContracts?.createCallAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await createCallContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('CreateCall contract is not deployed on the current network')
  }
  return createCallContract
}

export async function getSimulateTxAccessorContract({
  ethAdapter,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SimulateTxAccessorContractImplementationType> {
  const simulateTxAccessorContract = await ethAdapter.getSimulateTxAccessorContract({
    safeVersion,
    customContractAddress: customContracts?.simulateTxAccessorAddress,
    customContractAbi: customContracts?.simulateTxAccessorAbi
  })
  const isContractDeployed = await ethAdapter.isContractDeployed(
    await simulateTxAccessorContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('SimulateTxAccessor contract is not deployed on the current network')
  }
  return simulateTxAccessorContract
}
