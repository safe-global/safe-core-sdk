import { ContractNetworksConfig } from '@safe-global/protocol-kit/index'
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
