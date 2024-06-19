import { JsonFragment } from 'ethers'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

import SafeContract_v1_0_0 from '@safe-global/protocol-kit/contracts/Safe/v1.0.0/SafeContract_v1_0_0'
import SafeContract_v1_1_1 from '@safe-global/protocol-kit/contracts/Safe/v1.1.1/SafeContract_v1_1_1'
import SafeContract_v1_2_0 from '@safe-global/protocol-kit/contracts/Safe/v1.2.0/SafeContract_v1_2_0'
import SafeContract_v1_3_0 from '@safe-global/protocol-kit/contracts/Safe/v1.3.0/SafeContract_v1_3_0'
import SafeContract_v1_4_1 from '@safe-global/protocol-kit/contracts/Safe/v1.4.1/SafeContract_v1_4_1'
import MultiSendContract_v1_1_1 from '@safe-global/protocol-kit/contracts/MultiSend/v1.1.1/MultiSendContract_v1_1_1'
import MultiSendContract_v1_3_0 from '@safe-global/protocol-kit/contracts/MultiSend/v1.3.0/MultiSendContract_v1_3_0'
import MultiSendContract_v1_4_1 from '@safe-global/protocol-kit/contracts/MultiSend/v1.4.1/MultiSendContract_v1_4_1'
import MultiSendCallOnlyContract_v1_4_1 from '@safe-global/protocol-kit/contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import MultiSendCallOnlyContract_v1_3_0 from '@safe-global/protocol-kit/contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import CompatibilityFallbackHandlerContract_v1_3_0 from '@safe-global/protocol-kit/contracts/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0'
import CompatibilityFallbackHandlerContract_v1_4_1 from '@safe-global/protocol-kit/contracts/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1'
import SafeProxyFactoryContract_v1_0_0 from '@safe-global/protocol-kit/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0'
import SafeProxyFactoryContract_v1_1_1 from '@safe-global/protocol-kit/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import SafeProxyFactoryContract_v1_3_0 from '@safe-global/protocol-kit/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0'
import SafeProxyFactoryContract_v1_4_1 from '@safe-global/protocol-kit/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1'
import SignMessageLibContract_v1_3_0 from '@safe-global/protocol-kit/contracts/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0'
import SignMessageLibContract_v1_4_1 from '@safe-global/protocol-kit/contracts/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1'
import SimulateTxAccessorContract_v1_3_0 from '@safe-global/protocol-kit/contracts/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0'
import SimulateTxAccessorContract_v1_4_1 from '@safe-global/protocol-kit/contracts/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1'
import CreateCallContract_v1_3_0 from '@safe-global/protocol-kit/contracts/CreateCall/v1.3.0/CreateCallContract_v1_3_0'
import CreateCallContract_v1_4_1 from '@safe-global/protocol-kit/contracts/CreateCall/v1.4.1/CreateCallContract_v1_4_1'
import SafeWebAuthnSignerFactoryContract_v1_4_1 from '@safe-global/protocol-kit/contracts/SafeWebAuthnSignerFactory/v1.4.1/SafeWebAuthnSignerFactoryContract_v1_4_1'

// Safe contract implementation types
export type SafeContractImplementationType =
  | SafeContract_v1_0_0
  | SafeContract_v1_1_1
  | SafeContract_v1_2_0
  | SafeContract_v1_3_0
  | SafeContract_v1_4_1

// MultiSend contract implementation types
export type MultiSendContractImplementationType =
  | MultiSendContract_v1_1_1
  | MultiSendContract_v1_3_0
  | MultiSendContract_v1_4_1

// MultiSendCallOnly contract implementation types
export type MultiSendCallOnlyContractImplementationType =
  | MultiSendCallOnlyContract_v1_3_0
  | MultiSendCallOnlyContract_v1_4_1

// CompatibilityFallbackHandler contract implementation types
export type CompatibilityFallbackHandlerContractImplementationType =
  | CompatibilityFallbackHandlerContract_v1_3_0
  | CompatibilityFallbackHandlerContract_v1_4_1

// SafeProxyFactory contract implementation types
export type SafeProxyFactoryContractImplementationType =
  | SafeProxyFactoryContract_v1_0_0
  | SafeProxyFactoryContract_v1_1_1
  | SafeProxyFactoryContract_v1_3_0
  | SafeProxyFactoryContract_v1_4_1

// SignMessageLib contract implementation types
export type SignMessageLibContractImplementationType =
  | SignMessageLibContract_v1_3_0
  | SignMessageLibContract_v1_4_1

// SimulateTxAccessor contract implementation types
export type SimulateTxAccessorContractImplementationType =
  | SimulateTxAccessorContract_v1_3_0
  | SimulateTxAccessorContract_v1_4_1

// CreateCall contract implementation types
export type CreateCallContractImplementationType =
  | CreateCallContract_v1_3_0
  | CreateCallContract_v1_4_1

// SafeWebAuthnSignerFactory contract implementation types
export type SafeWebAuthnSignerFactoryContractImplementationType =
  SafeWebAuthnSignerFactoryContract_v1_4_1

export type GetContractProps = {
  safeVersion: SafeVersion
  customContractAddress?: string
  customContractAbi?: JsonFragment | JsonFragment[]
  isL1SafeSingleton?: boolean
}

export type ContractNetworkConfig = {
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
  /** safeWebAuthnSignerFactoryAddress - Address of the SafeWebAuthnSignerFactory contract deployed on a specific network */
  safeWebAuthnSignerFactoryAddress: string
  /** safeWebAuthnSignerFactoryAbi - Abi of the SafeWebAuthnSignerFactory contract deployed on a specific network */
  safeWebAuthnSignerFactoryAbi?: JsonFragment | JsonFragment[]
}

export type ContractNetworksConfig = {
  /** id - Network id */
  [id: string]: ContractNetworkConfig
}
