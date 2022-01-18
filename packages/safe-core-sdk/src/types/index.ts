interface AbiInput {
  name: string
  type: string
  indexed?: boolean
  components?: AbiInput[]
  internalType?: string
}

interface AbiOutput {
  name: string
  type: string
  components?: AbiOutput[]
  internalType?: string
}

export interface AbiItem {
  anonymous?: boolean
  constant?: boolean
  inputs?: AbiInput[]
  name?: string
  outputs?: AbiOutput[]
  payable?: boolean
  stateMutability: string
  type: string
  gas?: number
}

export interface ContractNetworkConfig {
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** multiSendAbi - Abi of the MultiSend contract deployed on a specific network */
  multiSendAbi?: AbiItem[]
  /** safeMasterCopyAddress - Address of the Gnosis Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAddress: string
  /** safeMasterCopyAbi - Abi of the Gnosis Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAbi?: AbiItem[]
  /** safeProxyFactoryAddress - Address of the Gnosis Safe Proxy Factory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the Gnosis Safe Proxy Factory contract deployed on a specific network */
  safeProxyFactoryAbi?: AbiItem[]
}

export interface ContractNetworksConfig {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}
