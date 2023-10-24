import { ContractNetworksConfig } from '@safe-global/protocol-kit/index'
import {
  getCompatibilityFallbackHandler,
  getCreateCall,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSignMessageLib,
  getSimulateTxAccessor
} from './setupContracts'

export async function getContractNetworks(chainId: number): Promise<ContractNetworksConfig> {
  return {
    [chainId]: {
      safeSingletonAddress: await (await getSafeSingleton()).contract.getAddress(),
      safeSingletonAbi: (await getSafeSingleton()).abi,
      safeProxyFactoryAddress: await (await getFactory()).contract.getAddress(),
      safeProxyFactoryAbi: (await getFactory()).abi,
      multiSendAddress: await (await getMultiSend()).contract.getAddress(),
      multiSendAbi: (await getMultiSend()).abi,
      multiSendCallOnlyAddress: await (await getMultiSendCallOnly()).contract.getAddress(),
      multiSendCallOnlyAbi: (await getMultiSendCallOnly()).abi,
      fallbackHandlerAddress: await (await getCompatibilityFallbackHandler()).contract.getAddress(),
      fallbackHandlerAbi: (await getCompatibilityFallbackHandler()).abi,
      signMessageLibAddress: await (await getSignMessageLib()).contract.getAddress(),
      signMessageLibAbi: (await getSignMessageLib()).abi,
      createCallAddress: await (await getCreateCall()).contract.getAddress(),
      createCallAbi: (await getCreateCall()).abi,
      simulateTxAccessorAddress: await (await getSimulateTxAccessor()).contract.getAddress(),
      simulateTxAccessorAbi: (await getSimulateTxAccessor()).abi
    }
  }
}
