import { Abi } from 'viem'
import {
  getCompatibilityFallbackHandler,
  getCreateCall,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSafeWebAuthnSharedSigner,
  getSafeWebAuthnSignerFactory,
  getSignMessageLib,
  getSimulateTxAccessor
} from './setupContracts'

export type ContractNetworkConfig = {
  /** safeSingletonAddress - Address of the Safe Singleton contract deployed on a specific network */
  safeSingletonAddress: string
  /** safeSingletonAbi - Abi of the Safe Singleton contract deployed on a specific network */
  safeSingletonAbi?: Abi
  /** safeProxyFactoryAddress - Address of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAbi?: Abi
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** multiSendAbi - Abi of the MultiSend contract deployed on a specific network */
  multiSendAbi?: Abi
  /** multiSendCallOnlyAddress - Address of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAddress: string
  /** multiSendCallOnlyAbi - Abi of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAbi?: Abi
  /** fallbackHandlerAddress - Address of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAddress: string
  /** fallbackHandlerAbi - Abi of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAbi?: Abi
  /** signMessageLibAddress - Address of the SignMessageLib contract deployed on a specific network */
  signMessageLibAddress: string
  /** signMessageLibAbi - Abi of the SignMessageLib contract deployed on a specific network */
  signMessageLibAbi?: Abi
  /** createCallAddress - Address of the CreateCall contract deployed on a specific network */
  createCallAddress: string
  /** createCallAbi - Abi of the CreateCall contract deployed on a specific network */
  createCallAbi?: Abi
  /** simulateTxAccessorAddress - Address of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAddress: string
  /** simulateTxAccessorAbi - Abi of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAbi?: Abi
  /** safeWebAuthnSignerFactoryAddress - Address of the SafeWebAuthnSignerFactory contract deployed on a specific network */
  safeWebAuthnSignerFactoryAddress: string
  /** safeWebAuthnSignerFactoryAbi - Abi of the SafeWebAuthnSignerFactory contract deployed on a specific network */
  safeWebAuthnSignerFactoryAbi?: Abi
  /** safeWebAuthnSharedSignerAddress - Address of the SafeWebAuthnSharedSigner contract deployed on a specific network */
  safeWebAuthnSharedSignerAddress: string
  /** safeWebAuthnSharedSignerAbi - Abi of the SafeWebAuthnSharedSigner contract deployed on a specific network */
  safeWebAuthnSharedSignerAbi?: Abi
}

export type ContractNetworksConfig = {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}

export async function getContractNetworks(chainId: bigint): Promise<ContractNetworksConfig> {
  return {
    [chainId.toString()]: {
      safeSingletonAddress: await (await getSafeSingleton()).contract.address,
      safeSingletonAbi: (await getSafeSingleton()).abi,
      safeProxyFactoryAddress: await (await getFactory()).contract.address,
      safeProxyFactoryAbi: (await getFactory()).abi,
      multiSendAddress: await (await getMultiSend()).contract.address,
      multiSendAbi: (await getMultiSend()).abi,
      multiSendCallOnlyAddress: await (await getMultiSendCallOnly()).contract.address,
      multiSendCallOnlyAbi: (await getMultiSendCallOnly()).abi,
      fallbackHandlerAddress: await (await getCompatibilityFallbackHandler()).contract.address,
      fallbackHandlerAbi: (await getCompatibilityFallbackHandler()).abi,
      signMessageLibAddress: await (await getSignMessageLib()).contract.address,
      signMessageLibAbi: (await getSignMessageLib()).abi,
      createCallAddress: await (await getCreateCall()).contract.address,
      createCallAbi: (await getCreateCall()).abi,
      simulateTxAccessorAddress: await (await getSimulateTxAccessor()).contract.address,
      simulateTxAccessorAbi: (await getSimulateTxAccessor()).abi,
      safeWebAuthnSignerFactoryAddress: await (
        await getSafeWebAuthnSignerFactory()
      ).contract.address,
      safeWebAuthnSignerFactoryAbi: (await getSafeWebAuthnSignerFactory()).abi,
      safeWebAuthnSharedSignerAddress: await (await getSafeWebAuthnSharedSigner()).contract.address,
      safeWebAuthnSharedSignerAbi: (await getSafeWebAuthnSharedSigner()).abi
    }
  }
}
