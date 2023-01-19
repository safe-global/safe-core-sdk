import { AbiItem } from 'web3-utils'

export interface ContractNetworkConfig {
  /** safeMasterCopyAddress - Address of the GnosisSafe Master Copy contract deployed on a specific network */
  safeMasterCopyAddress: string
  /** safeMasterCopyAbi - Abi of the GnosisSafe Master Copy contract deployed on a specific network */
  safeMasterCopyAbi?: AbiItem | AbiItem[]
  /** safeProxyFactoryAddress - Address of the GnosisSafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the GnosisSafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAbi?: AbiItem | AbiItem[]
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** multiSendAbi - Abi of the MultiSend contract deployed on a specific network */
  multiSendAbi?: AbiItem | AbiItem[]
  /** multiSendCallOnlyAddress - Address of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAddress: string
  /** multiSendCallOnlyAbi - Abi of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAbi?: AbiItem | AbiItem[]
  /** fallbackHandlerAddress - Address of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAddress: string
  /** fallbackHandlerAbi - Abi of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAbi?: AbiItem | AbiItem[]
  /** signMessageLibAddress - Address of the SignMessageLib contract deployed on a specific network */
  signMessageLibAddress: string
  /** signMessageLibAbi - Abi of the SignMessageLib contract deployed on a specific network */
  signMessageLibAbi?: AbiItem | AbiItem[]
  /** createCallAddress - Address of the CreateCall contract deployed on a specific network */
  createCallAddress: string
  /** createCallAbi - Abi of the CreateCall contract deployed on a specific network */
  createCallAbi?: AbiItem | AbiItem[]
}

export interface ContractNetworksConfig {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}
