import Safe from './Safe'
import {
  CreateCallBaseContract,
  SafeProvider,
  SafeProviderConfig,
  MultiSendBaseContract,
  MultiSendCallOnlyBaseContract,
  SafeBaseContract,
  SafeProxyFactoryBaseContract,
  SignMessageLibBaseContract
} from './contracts'
import { DEFAULT_SAFE_VERSION } from './contracts/config'
import {
  getCompatibilityFallbackHandlerContract,
  getCreateCallContract,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract
} from './contracts/safeDeploymentContracts'
import {
  PREDETERMINED_SALT_NONCE,
  encodeCreateProxyWithNonce,
  encodeSetupCallData,
  predictSafeAddress
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import SafeFactory, { DeploySafeProps, SafeFactoryConfig } from './SafeFactory'
import {
  AddOwnerTxParams,
  ConnectSafeConfig,
  ConnectSafeConfigWithPredictedSafe,
  ConnectSafeConfigWithSafeAddress,
  ContractNetworksConfig,
  CreateTransactionProps,
  PredictedSafeProps,
  RemoveOwnerTxParams,
  SafeAccountConfig,
  SafeConfig,
  SafeConfigWithPredictedSafe,
  SafeConfigWithSafeAddress,
  SafeDeploymentConfig,
  StandardizeSafeTransactionDataProps,
  SwapOwnerTxParams,
  SigningMethod
} from './types'
import {
  EthSafeSignature,
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  validateEthereumAddress,
  validateEip3770Address
} from './utils'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { encodeMultiSendData, standardizeSafeTransactionData } from './utils/transactions/utils'
import {
  getERC20Decimals,
  isGasTokenCompatibleWithHandlePayment,
  createERC20TokenTransferTransaction
} from './utils/erc-20'

import {
  generateSignature,
  generateEIP712Signature,
  buildContractSignature,
  buildSignatureBytes,
  preimageSafeTransactionHash,
  preimageSafeMessageHash
} from './utils/signatures/utils'

import {
  getEip712TxTypes,
  getEip712MessageTypes,
  hashSafeMessage,
  generateTypedData
} from './utils/eip-712'

export {
  AddOwnerTxParams,
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  ConnectSafeConfig,
  ConnectSafeConfigWithPredictedSafe,
  ConnectSafeConfigWithSafeAddress,
  ContractManager,
  ContractNetworksConfig,
  CreateCallBaseContract,
  createERC20TokenTransferTransaction,
  CreateTransactionProps,
  DEFAULT_SAFE_VERSION,
  DeploySafeProps,
  EthSafeSignature,
  SafeProvider,
  SafeProviderConfig,
  MultiSendCallOnlyBaseContract,
  MultiSendBaseContract,
  PREDETERMINED_SALT_NONCE,
  PredictedSafeProps,
  RemoveOwnerTxParams,
  SafeAccountConfig,
  SafeConfig,
  SafeConfigWithPredictedSafe,
  SafeConfigWithSafeAddress,
  SafeBaseContract,
  SafeDeploymentConfig,
  SafeFactory,
  SafeFactoryConfig,
  SafeProxyFactoryBaseContract,
  SafeTransactionOptionalProps,
  SignMessageLibBaseContract,
  StandardizeSafeTransactionDataProps,
  SwapOwnerTxParams,
  SigningMethod,
  encodeCreateProxyWithNonce,
  encodeMultiSendData,
  encodeSetupCallData,
  getCompatibilityFallbackHandlerContract,
  getCreateCallContract,
  getERC20Decimals,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract,
  isGasTokenCompatibleWithHandlePayment,
  predictSafeAddress,
  standardizeSafeTransactionData,
  validateEip3770Address,
  validateEthereumAddress,
  generateSignature,
  generateEIP712Signature,
  buildContractSignature,
  buildSignatureBytes,
  preimageSafeTransactionHash,
  preimageSafeMessageHash,
  getEip712TxTypes,
  getEip712MessageTypes,
  hashSafeMessage,
  generateTypedData
}

export default Safe
