import { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/utils/transactions'
import {
  EthAdapter,
  MetaTransactionData,
  SafeContract,
  SafeTransactionDataPartial,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { AbiItem } from 'web3-utils'

export interface SafeAccountConfig {
  owners: string[]
  threshold: number
  to?: string
  data?: string
  fallbackHandler?: string
  paymentToken?: string
  payment?: number
  paymentReceiver?: string
}

export interface SafeDeploymentConfig {
  saltNonce?: string
  safeVersion?: SafeVersion
}

export interface PredictedSafeProps {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
}

export interface ContractNetworkConfig {
  /** safeMasterCopyAddress - Address of the Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAddress: string
  /** safeMasterCopyAbi - Abi of the Safe Master Copy contract deployed on a specific network */
  safeMasterCopyAbi?: AbiItem | AbiItem[]
  /** safeProxyFactoryAddress - Address of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the SafeProxyFactory contract deployed on a specific network */
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
  /** simulateTxAccessorAddress - Address of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAddress: string
  /** simulateTxAccessorAbi - Abi of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAbi?: AbiItem | AbiItem[]
}

export interface ContractNetworksConfig {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}

type SafeConfigWithSafeAddressProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress: string
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type SafeConfigWithPredictedSafeProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe: PredictedSafeProps
}

export type SafeConfigProps = {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** isL1SafeMasterCopy - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type SafeConfigWithSafeAddress = SafeConfigProps & SafeConfigWithSafeAddressProps
export type SafeConfigWithPredictedSafe = SafeConfigProps & SafeConfigWithPredictedSafeProps
export type SafeConfig = SafeConfigWithSafeAddress | SafeConfigWithPredictedSafe

type ConnectSafeConfigWithSafeAddressProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: string
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type ConnectSafeConfigWithPredictedSafeProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: PredictedSafeProps
}

type ConnectSafeConfigProps = {
  /** ethAdapter - Ethereum adapter */
  ethAdapter?: EthAdapter
  /** isL1SafeMasterCopy - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type ConnectSafeConfigWithSafeAddress = ConnectSafeConfigProps &
  ConnectSafeConfigWithSafeAddressProps
export type ConnectSafeConfigWithPredictedSafe = ConnectSafeConfigProps &
  ConnectSafeConfigWithPredictedSafeProps
export type ConnectSafeConfig =
  | ConnectSafeConfigWithSafeAddress
  | ConnectSafeConfigWithPredictedSafe

export interface CreateTransactionProps {
  /** safeTransactionData - The transaction or transaction array to process */
  safeTransactionData: SafeTransactionDataPartial | MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: SafeTransactionOptionalProps
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}

export interface AddOwnerTxParams {
  /** ownerAddress - The address of the new owner */
  ownerAddress: string
  /** threshold - The new threshold */
  threshold?: number
}

export interface RemoveOwnerTxParams {
  /** ownerAddress - The address of the owner that will be removed */
  ownerAddress: string
  /** threshold - The new threshold */
  threshold?: number
}

export interface SwapOwnerTxParams {
  /** oldOwnerAddress - The old owner address */
  oldOwnerAddress: string
  /** newOwnerAddress - The new owner address */
  newOwnerAddress: string
}

type StandardizeSafeTxDataWithSafeContractProps = {
  /** safeContract - The Safe contract to use */
  safeContract: SafeContract
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type StandardizeSafeTxDataWithPredictedSafeProps = {
  /** safeContract - The Safe contract to use */
  safeContract?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe: PredictedSafeProps
}

interface StandardizeSafeTransactionData {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** tx - Safe transaction */
  tx: SafeTransactionDataPartial
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type StandardizeSafeTxDataWithSafeContract = StandardizeSafeTransactionData &
  StandardizeSafeTxDataWithSafeContractProps
export type StandardizeSafeTxDataWithPredictedSafe = StandardizeSafeTransactionData &
  StandardizeSafeTxDataWithPredictedSafeProps
export type StandardizeSafeTransactionDataProps =
  | StandardizeSafeTxDataWithSafeContract
  | StandardizeSafeTxDataWithPredictedSafe
