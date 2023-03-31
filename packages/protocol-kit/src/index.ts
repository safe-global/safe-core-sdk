import {
  getCompatibilityFallbackHandlerContract,
  getCreateCallContract,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract
} from './contracts/safeDeploymentContracts'
import ContractManager from './managers/contractManager'
import Safe, {
  AddOwnerTxParams,
  ConnectSafeConfig,
  CreateTransactionProps,
  RemoveOwnerTxParams,
  SafeConfig,
  SwapOwnerTxParams
} from './Safe'
import SafeFactory, {
  DeploySafeProps,
  PredictSafeProps,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactoryConfig
} from './safeFactory'
import {
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  CreateProxyProps as CreateEthersProxyProps,
  CreateCallEthersContract,
  GnosisSafeContractEthers,
  GnosisSafeProxyFactoryEthersContract,
  MultiSendEthersContract,
  MultiSendCallOnlyEthersContract,
  SignMessageLibEthersContract
} from './adapters/ethers'
import {
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  CreateProxyProps as CreateWeb3ProxyProps,
  Web3TransactionResult,
  CreateCallWeb3Contract,
  GnosisSafeContractWeb3,
  GnosisSafeProxyFactoryWeb3Contract,
  MultiSendWeb3Contract,
  MultiSendCallOnlyWeb3Contract,
  SignMessageLibWeb3Contract
} from './adapters/web3'

import { ContractNetworksConfig } from './types'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { standardizeSafeTransactionData } from './utils/transactions/utils'

export {
  ContractManager,
  SafeFactory,
  SafeFactoryConfig,
  SafeAccountConfig,
  SafeDeploymentConfig,
  PredictSafeProps,
  DeploySafeProps,
  SafeConfig,
  ConnectSafeConfig,
  ContractNetworksConfig,
  SafeTransactionOptionalProps,
  CreateTransactionProps,
  AddOwnerTxParams,
  RemoveOwnerTxParams,
  SwapOwnerTxParams,
  standardizeSafeTransactionData,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  CreateEthersProxyProps,
  CreateCallEthersContract,
  GnosisSafeContractEthers,
  GnosisSafeProxyFactoryEthersContract,
  MultiSendEthersContract,
  MultiSendCallOnlyEthersContract,
  SignMessageLibEthersContract,
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  CreateWeb3ProxyProps,
  Web3TransactionResult,
  CreateCallWeb3Contract,
  GnosisSafeContractWeb3,
  GnosisSafeProxyFactoryWeb3Contract,
  MultiSendWeb3Contract,
  MultiSendCallOnlyWeb3Contract,
  SignMessageLibWeb3Contract,
  getSafeContract,
  getProxyFactoryContract,
  getCompatibilityFallbackHandlerContract,
  getMultiSendContract,
  getMultiSendCallOnlyContract,
  getSignMessageLibContract,
  getCreateCallContract
}

export default Safe
