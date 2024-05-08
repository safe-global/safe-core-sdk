import SafeProvider from '../SafeProvider'
import {
  CompatibilityFallbackHandlerContractImplementationType,
  ContractNetworkConfig,
  CreateCallContractImplementationType,
  MultiSendCallOnlyContractImplementationType,
  MultiSendContractImplementationType,
  SafeContractImplementationType,
  SafeProxyFactoryContractImplementationType,
  SafeWebAuthnSignerFactoryContractImplementationType,
  SignMessageLibContractImplementationType,
  SimulateTxAccessorContractImplementationType
} from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

export interface GetContractInstanceProps {
  safeProvider: SafeProvider
  safeVersion: SafeVersion
  customContracts?: ContractNetworkConfig
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
  customContracts
}: GetSafeContractInstanceProps): Promise<SafeContractImplementationType> {
  const safeContract = await safeProvider.getSafeContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<SafeProxyFactoryContractImplementationType> {
  const safeProxyFactoryContract = await safeProvider.getSafeProxyFactoryContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<CompatibilityFallbackHandlerContractImplementationType> {
  const fallbackHandlerContract = await safeProvider.getCompatibilityFallbackHandlerContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<MultiSendContractImplementationType> {
  const multiSendContract = await safeProvider.getMultiSendContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<MultiSendCallOnlyContractImplementationType> {
  const multiSendCallOnlyContract = await safeProvider.getMultiSendCallOnlyContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<SignMessageLibContractImplementationType> {
  const signMessageLibContract = await safeProvider.getSignMessageLibContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<CreateCallContractImplementationType> {
  const createCallContract = await safeProvider.getCreateCallContract({
    safeVersion,
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
}: GetContractInstanceProps): Promise<SimulateTxAccessorContractImplementationType> {
  const simulateTxAccessorContract = await safeProvider.getSimulateTxAccessorContract({
    safeVersion,
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

export async function getSafeWebAuthnSignerFactoryContract({
  safeProvider,
  safeVersion,
  customContracts
}: GetContractInstanceProps): Promise<SafeWebAuthnSignerFactoryContractImplementationType> {
  const safeWebAuthnSignerFactoryContract = await safeProvider.getSafeWebAuthnSignerFactoryContract(
    {
      safeVersion,
      customContractAddress: customContracts?.simulateTxAccessorAddress,
      customContractAbi: customContracts?.simulateTxAccessorAbi
    }
  )

  const isContractDeployed = await safeProvider.isContractDeployed(
    await safeWebAuthnSignerFactoryContract.getAddress()
  )
  if (!isContractDeployed) {
    throw new Error('safeWebAuthnSignerFactory contract is not deployed on the current network')
  }
  return safeWebAuthnSignerFactoryContract
}
