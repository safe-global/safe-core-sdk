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
  safeSingletonAddress?: string
  /** safeProxyFactoryAddress - Address of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAddress?: string
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress?: string
  /** multiSendCallOnlyAddress - Address of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAddress?: string
  /** fallbackHandlerAddress - Address of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAddress?: string
  /** signMessageLibAddress - Address of the SignMessageLib contract deployed on a specific network */
  signMessageLibAddress?: string
  /** createCallAddress - Address of the CreateCall contract deployed on a specific network */
  createCallAddress?: string
  /** simulateTxAccessorAddress - Address of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAddress?: string
  /** safeWebAuthnSignerFactoryAddress - Address of the SafeWebAuthnSignerFactory contract deployed on a specific network */
  safeWebAuthnSignerFactoryAddress?: string
  /** safeWebAuthnSharedSignerAddress - Address of the SafeWebAuthnSharedSigner contract deployed on a specific network */
  safeWebAuthnSharedSignerAddress?: string
}

export type ContractNetworksConfig = {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}

export async function getContractNetworks(chainId: bigint): Promise<ContractNetworksConfig> {
  return {
    [chainId.toString()]: {
      safeSingletonAddress: (await getSafeSingleton()).contract.address,
      safeProxyFactoryAddress: (await getFactory()).contract.address,
      multiSendAddress: (await getMultiSend()).contract.address,
      multiSendCallOnlyAddress: (await getMultiSendCallOnly()).contract.address,
      fallbackHandlerAddress: (await getCompatibilityFallbackHandler()).contract.address,
      signMessageLibAddress: (await getSignMessageLib()).contract.address,
      createCallAddress: (await getCreateCall()).contract.address,
      simulateTxAccessorAddress: (await getSimulateTxAccessor()).contract.address,
      safeWebAuthnSignerFactoryAddress: (await getSafeWebAuthnSignerFactory()).contract.address,
      safeWebAuthnSharedSignerAddress: (await getSafeWebAuthnSharedSigner()).contract.address
    }
  }
}
