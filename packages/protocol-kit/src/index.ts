import Safe from './Safe'
import {
  CreateCallEthersContract,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  MultiSendBaseContractEthers,
  MultiSendCallOnlyBaseContractEthers,
  SafeContractEthers,
  SafeProxyFactoryBaseContractEthers,
  SignMessageLibBaseContractEthers
} from './adapters/ethers'
import {
  CreateCallWeb3Contract,
  MultiSendBaseContractWeb3,
  MultiSendCallOnlyBaseContractWeb3,
  SafeContractWeb3,
  SafeProxyFactoryBaseContractWeb3,
  SignMessageLibBaseContractWeb3,
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  Web3TransactionResult
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
  predictSafeAddress
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
  SwapOwnerTxParams
} from './types'
import {
  EthSafeSignature,
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  validateEip3770Address
} from './utils'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { encodeMultiSendData, standardizeSafeTransactionData } from './utils/transactions/utils'
import {
  getERC20Decimals,
  isGasTokenCompatibleWithHandlePayment,
  createERC20TokenTransferTransaction
} from './utils/erc-20'

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
  CreateCallEthersContract,
  CreateCallWeb3Contract,
  createERC20TokenTransferTransaction,
  CreateTransactionProps,
  DEFAULT_SAFE_VERSION,
  DeploySafeProps,
  EthSafeSignature,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
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
  SafeContractEthers,
  SafeContractWeb3,
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
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  Web3TransactionResult,
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
  validateEip3770Address
}

export default Safe
