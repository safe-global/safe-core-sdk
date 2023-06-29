import {
  CreateCallEthersContract,
  CreateProxyProps as CreateEthersProxyProps,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  MultiSendCallOnlyEthersContract,
  MultiSendEthersContract,
  SafeContractEthers,
  SafeProxyFactoryEthersContract,
  SignMessageLibEthersContract
} from './adapters/ethers'
import {
  CreateCallWeb3Contract,
  CreateProxyProps as CreateWeb3ProxyProps,
  MultiSendCallOnlyWeb3Contract,
  MultiSendWeb3Contract,
  SafeContractWeb3,
  SafeProxyFactoryWeb3Contract,
  SignMessageLibWeb3Contract,
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  Web3TransactionResult
} from './adapters/web3'
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
  encodeCreateProxyWithNonce,
  encodeSetupCallData,
  PREDETERMINED_SALT_NONCE,
  predictSafeAddress
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import Safe from './Safe'
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
import { EthSafeSignature } from './utils'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { encodeMultiSendData, standardizeSafeTransactionData } from './utils/transactions/utils'

export {
  AddOwnerTxParams,
  ConnectSafeConfig,
  ConnectSafeConfigWithPredictedSafe,
  ConnectSafeConfigWithSafeAddress,
  ContractManager,
  ContractNetworksConfig,
  CreateCallEthersContract,
  CreateCallWeb3Contract,
  CreateEthersProxyProps,
  CreateTransactionProps,
  CreateWeb3ProxyProps,
  DeploySafeProps,
  encodeCreateProxyWithNonce,
  encodeMultiSendData,
  encodeSetupCallData,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  EthSafeSignature,
  getCompatibilityFallbackHandlerContract,
  getCreateCallContract,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract,
  MultiSendCallOnlyEthersContract,
  MultiSendCallOnlyWeb3Contract,
  MultiSendEthersContract,
  MultiSendWeb3Contract,
  PREDETERMINED_SALT_NONCE,
  PredictedSafeProps,
  predictSafeAddress,
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
  SafeProxyFactoryEthersContract,
  SafeProxyFactoryWeb3Contract,
  SafeTransactionOptionalProps,
  SignMessageLibEthersContract,
  SignMessageLibWeb3Contract,
  standardizeSafeTransactionData,
  StandardizeSafeTransactionDataProps,
  SwapOwnerTxParams,
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  Web3TransactionResult
}

export default Safe
