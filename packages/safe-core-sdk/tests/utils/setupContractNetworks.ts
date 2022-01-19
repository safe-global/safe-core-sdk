import { ContractNetworksConfig } from '../../src'
import { getFactory, getMultiSend, getSafeSingleton } from './setupContracts'

export async function getContractNetworks(chainId: number): Promise<ContractNetworksConfig> {
  return {
    [chainId]: {
      multiSendAddress: (await getMultiSend()).contract.address,
      multiSendAbi: (await getMultiSend()).abi,
      safeMasterCopyAddress: (await getSafeSingleton()).contract.address,
      safeMasterCopyAbi: (await getSafeSingleton()).abi,
      safeProxyFactoryAddress: (await getFactory()).contract.address,
      safeProxyFactoryAbi: (await getFactory()).abi
    }
  }
}
