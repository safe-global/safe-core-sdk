import { AbiItem } from 'web3-utils';

export interface ContractNetworkConfig {
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** multiSendAbi - Abi of the MultiSend contract deployed on a specific network */
  multiSendAbi?: AbiItem | AbiItem[]
  /** safeMasterCopyAddress - Address of the Gnosis Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAddress: string
  /** safeMasterCopyAbi - Abi of the Gnosis Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAbi?: AbiItem | AbiItem[]
  /** safeProxyFactoryAddress - Address of the Gnosis Safe Proxy Factory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the Gnosis Safe Proxy Factory contract deployed on a specific network */
  safeProxyFactoryAbi?: AbiItem | AbiItem[]
}

export interface ContractNetworksConfig {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}
