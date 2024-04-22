import Safe from './Safe'
import {
  CreateCallBaseContractEthers,
  EthersAdapter,
  EthersAdapterConfig,
  MultiSendBaseContractEthers,
  MultiSendCallOnlyBaseContractEthers,
  SafeBaseContractEthers,
  SafeProxyFactoryBaseContractEthers,
  SignMessageLibBaseContractEthers
} from './adapters/ethers'
import {
  CreateCallBaseContractWeb3,
  MultiSendBaseContractWeb3,
  MultiSendCallOnlyBaseContractWeb3,
  SafeBaseContractWeb3,
  SafeProxyFactoryBaseContractWeb3,
  SignMessageLibBaseContractWeb3,
  Web3Adapter,
  Web3AdapterConfig
} from './adapters/web3'
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
  predictSafeAddress,
  getPredictedSafeAddressInitCode
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import SafeFactory, { DeploySafeProps, SafeFactoryConfig } from './safeFactory'
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
import { EthAdapter } from './adapters/ethAdapter'

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
  CreateCallBaseContractEthers,
  CreateCallBaseContractWeb3,
  createERC20TokenTransferTransaction,
  CreateTransactionProps,
  DEFAULT_SAFE_VERSION,
  DeploySafeProps,
  EthAdapter,
  EthSafeSignature,
  EthersAdapter,
  EthersAdapterConfig,
  MultiSendCallOnlyBaseContractEthers,
  MultiSendCallOnlyBaseContractWeb3,
  MultiSendBaseContractEthers,
  MultiSendBaseContractWeb3,
  PREDETERMINED_SALT_NONCE,
  PredictedSafeProps,
  RemoveOwnerTxParams,
  SafeAccountConfig,
  SafeConfig,
  SafeConfigWithPredictedSafe,
  SafeConfigWithSafeAddress,
  SafeBaseContractEthers,
  SafeBaseContractWeb3,
  SafeDeploymentConfig,
  SafeFactory,
  SafeFactoryConfig,
  SafeProxyFactoryBaseContractEthers,
  SafeProxyFactoryBaseContractWeb3,
  SafeTransactionOptionalProps,
  SignMessageLibBaseContractEthers,
  SignMessageLibBaseContractWeb3,
  StandardizeSafeTransactionDataProps,
  SwapOwnerTxParams,
  SigningMethod,
  Web3Adapter,
  Web3AdapterConfig,
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
  getPredictedSafeAddressInitCode,
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
