import { ContractNetworksConfig } from '../../src'
import { getFactory, getMultiSend, getMultiSendCallOnly, getSafeSingleton } from './setupContracts'

export async function getContractNetworks(chainId: number): Promise<ContractNetworksConfig> {
  return {
    [chainId]: {
      multiSendAddress: (await getMultiSend()).contract.address,
      multiSendAbi: (await getMultiSend()).abi,
      multiSendCallOnlyAddress: (await getMultiSendCallOnly()).contract.address,
      multiSendCallOnlyAbi: (await getMultiSendCallOnly()).abi,
      safeMasterCopyAddress: (await getSafeSingleton()).contract.address,
      safeMasterCopyAbi: (await getSafeSingleton()).abi,
      safeProxyFactoryAddress: (await getFactory()).contract.address,
      safeProxyFactoryAbi: (await getFactory()).abi
    }
  }
}
