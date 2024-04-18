import { JsonFragment } from 'ethers'
import { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/utils/transactions'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import SafeContract_v1_0_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.0.0/SafeContract_v1_0_0_Ethers'
import SafeContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.1.1/SafeContract_v1_1_1_Ethers'
import SafeContract_v1_2_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.2.0/SafeContract_v1_2_0_Ethers'
import SafeContract_v1_3_0_Ethers from '@safe-global/protocol-kit/v1.3.0/SafeContract_v1_3_0_Ethers'
import SafeContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/v1.4.1/SafeContract_v1_4_1_Ethers'
import MultiSendContract_v1_1_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.1.1/MultiSendContract_v1_1_1_Ethers'
import MultiSendContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.3.0/MultiSendContract_v1_3_0_Ethers'
import MultiSendContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.4.1/MultiSendContract_v1_4_1_Ethers'
import MultiSendCallOnlyContract_v1_4_1_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1_Ethers'
import MultiSendCallOnlyContract_v1_3_0_Ethers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0_Ethers'
import CompatibilityFallbackHandlerContract_v1_3_0_Ethers from '../adapters/ethers/contracts/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0_Ethers'
import CompatibilityFallbackHandlerContract_v1_4_1_Ethers from '../adapters/ethers/contracts/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1_Ethers'
import SafeProxyFactoryContract_v1_0_0_Ethers from '../adapters/ethers/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0_Ethers'
import SafeProxyFactoryContract_v1_1_1_Ethers from '../adapters/ethers/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1_Ethers'
import SafeProxyFactoryContract_v1_3_0_Ethers from '../adapters/ethers/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0_Ethers'
import SafeProxyFactoryContract_v1_4_1_Ethers from '../adapters/ethers/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1_Ethers'
import SignMessageLibContract_v1_3_0_Ethers from '../adapters/ethers/contracts/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0_Ethers'
import SignMessageLibContract_v1_4_1_Ethers from '../adapters/ethers/contracts/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1_Ethers'
import SimulateTxAccessorContract_v1_3_0_Ethers from '../adapters/ethers/contracts/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0_Ethers'
import SimulateTxAccessorContract_v1_4_1_Ethers from '../adapters/ethers/contracts/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1_Ethers'
import CreateCallContract_v1_3_0_Ethers from '../adapters/ethers/contracts/CreateCall/v1.3.0/CreateCallContract_v1_3_0_Ethers'
import CreateCallContract_v1_4_1_Ethers from '../adapters/ethers/contracts/CreateCall/v1.4.1/CreateCallContract_v1_4_1_Ethers'
import { Eip1193Provider } from '../adapters/ethAdapter'

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
  /** safeSingletonAddress - Address of the Safe Singleton contract deployed on a specific network */
  safeSingletonAddress: string
  /** safeSingletonAbi - Abi of the Safe Singleton contract deployed on a specific network */
  safeSingletonAbi?: JsonFragment | JsonFragment[]
  /** safeProxyFactoryAddress - Address of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAddress: string
  /** safeProxyFactoryAbi - Abi of the SafeProxyFactory contract deployed on a specific network */
  safeProxyFactoryAbi?: JsonFragment | JsonFragment[]
  /** multiSendAddress - Address of the MultiSend contract deployed on a specific network */
  multiSendAddress: string
  /** multiSendAbi - Abi of the MultiSend contract deployed on a specific network */
  multiSendAbi?: JsonFragment | JsonFragment[]
  /** multiSendCallOnlyAddress - Address of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAddress: string
  /** multiSendCallOnlyAbi - Abi of the MultiSendCallOnly contract deployed on a specific network */
  multiSendCallOnlyAbi?: JsonFragment | JsonFragment[]
  /** fallbackHandlerAddress - Address of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAddress: string
  /** fallbackHandlerAbi - Abi of the Fallback Handler contract deployed on a specific network */
  fallbackHandlerAbi?: JsonFragment | JsonFragment[]
  /** signMessageLibAddress - Address of the SignMessageLib contract deployed on a specific network */
  signMessageLibAddress: string
  /** signMessageLibAbi - Abi of the SignMessageLib contract deployed on a specific network */
  signMessageLibAbi?: JsonFragment | JsonFragment[]
  /** createCallAddress - Address of the CreateCall contract deployed on a specific network */
  createCallAddress: string
  /** createCallAbi - Abi of the CreateCall contract deployed on a specific network */
  createCallAbi?: JsonFragment | JsonFragment[]
  /** simulateTxAccessorAddress - Address of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAddress: string
  /** simulateTxAccessorAbi - Abi of the SimulateTxAccessor contract deployed on a specific network */
  simulateTxAccessorAbi?: JsonFragment | JsonFragment[]
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
  /** provider - Compatible EIP-1193 provider */
  provider: Eip1193Provider
  signerAddress?: string
  privateKeyOrMnemonic?: string
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
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
  /** provider - Compatible EIP-1193 provider */
  provider?: Eip1193Provider
  signerAddress?: string
  privateKeyOrMnemonic?: string
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
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
  /** transactions - The transaction array to process */
  transactions: MetaTransactionData[]
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
  safeContract: SafeContractImplementationType
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
  /** provider - Compatible EIP-1193 provider */
  provider: Eip1193Provider
  signerAddress?: string
  privateKeyOrMnemonic?: string
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

export enum SigningMethod {
  ETH_SIGN = 'eth_sign',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SAFE_SIGNATURE = 'safe_sign'
}

export type SigningMethodType = SigningMethod | string

// Safe contract implementation types

export type SafeContract_v1_0_0_ImplementationType = SafeContract_v1_0_0_Ethers

export type SafeContract_v1_1_0_ImplementationType = SafeContract_v1_1_1_Ethers

export type SafeContract_v1_2_0_ImplementationType = SafeContract_v1_2_0_Ethers

export type SafeContract_v1_3_0_ImplementationType = SafeContract_v1_3_0_Ethers

export type SafeContract_v1_4_1_ImplementationType = SafeContract_v1_4_1_Ethers

export type SafeContractImplementationType =
  | SafeContract_v1_0_0_ImplementationType
  | SafeContract_v1_1_0_ImplementationType
  | SafeContract_v1_2_0_ImplementationType
  | SafeContract_v1_3_0_ImplementationType
  | SafeContract_v1_4_1_ImplementationType

// MultiSend contract implementation types

export type MultiSendContract_v1_1_1_ImplementationType = MultiSendContract_v1_1_1_Ethers

export type MultiSendContract_v1_3_0_ImplementationType = MultiSendContract_v1_3_0_Ethers

export type MultiSendContract_v1_4_1_ImplementationType = MultiSendContract_v1_4_1_Ethers

export type MultiSendContractImplementationType =
  | MultiSendContract_v1_1_1_ImplementationType
  | MultiSendContract_v1_3_0_ImplementationType
  | MultiSendContract_v1_4_1_ImplementationType

// MultiSendCallOnly contract implementation types

export type MultiSendCallOnlyContract_v1_3_0_ImplementationType =
  MultiSendCallOnlyContract_v1_3_0_Ethers

export type MultiSendCallOnlyContract_v1_4_1_ImplementationType =
  MultiSendCallOnlyContract_v1_4_1_Ethers

export type MultiSendCallOnlyContractImplementationType =
  | MultiSendCallOnlyContract_v1_3_0_ImplementationType
  | MultiSendCallOnlyContract_v1_4_1_ImplementationType

// CompatibilityFallbackHandler contract implementation types

export type CompatibilityFallbackHandlerContract_v1_3_0_ImplementationType =
  CompatibilityFallbackHandlerContract_v1_3_0_Ethers

export type CompatibilityFallbackHandlerContract_v1_4_1_ImplementationType =
  CompatibilityFallbackHandlerContract_v1_4_1_Ethers

export type CompatibilityFallbackHandlerContractImplementationType =
  | CompatibilityFallbackHandlerContract_v1_3_0_ImplementationType
  | CompatibilityFallbackHandlerContract_v1_4_1_ImplementationType

// SafeProxyFactory contract implementation types

export type SafeProxyFactoryContract_v1_0_0_ImplementationType =
  SafeProxyFactoryContract_v1_0_0_Ethers

export type SafeProxyFactoryContract_v1_1_1_ImplementationType =
  SafeProxyFactoryContract_v1_1_1_Ethers

export type SafeProxyFactoryContract_v1_3_0_ImplementationType =
  SafeProxyFactoryContract_v1_3_0_Ethers

export type SafeProxyFactoryContract_v1_4_1_ImplementationType =
  SafeProxyFactoryContract_v1_4_1_Ethers

export type SafeProxyFactoryContractImplementationType =
  | SafeProxyFactoryContract_v1_0_0_ImplementationType
  | SafeProxyFactoryContract_v1_1_1_ImplementationType
  | SafeProxyFactoryContract_v1_3_0_ImplementationType
  | SafeProxyFactoryContract_v1_4_1_ImplementationType

// SignMessageLib contract implementation types

export type SignMessageLibContract_v1_3_0_ImplementationType = SignMessageLibContract_v1_3_0_Ethers

export type SignMessageLibContract_v1_4_1_ImplementationType = SignMessageLibContract_v1_4_1_Ethers

export type SignMessageLibContractImplementationType =
  | SignMessageLibContract_v1_3_0_ImplementationType
  | SignMessageLibContract_v1_4_1_ImplementationType

// SimulateTxAccessor contract implementation types

export type SimulateTxAccessorContract_v1_3_0_ImplementationType =
  SimulateTxAccessorContract_v1_3_0_Ethers

export type SimulateTxAccessorContract_v1_4_1_ImplementationType =
  SimulateTxAccessorContract_v1_4_1_Ethers

export type SimulateTxAccessorContractImplementationType =
  | SimulateTxAccessorContract_v1_3_0_ImplementationType
  | SimulateTxAccessorContract_v1_4_1_ImplementationType

// CreateCall contract implementation types

export type CreateCallContract_v1_3_0_ImplementationType = CreateCallContract_v1_3_0_Ethers

export type CreateCallContract_v1_4_1_ImplementationType = CreateCallContract_v1_4_1_Ethers

export type CreateCallContractImplementationType =
  | CreateCallContract_v1_3_0_ImplementationType
  | CreateCallContract_v1_4_1_ImplementationType
