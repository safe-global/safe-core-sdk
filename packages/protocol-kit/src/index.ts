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
  CreateProxyProps as CreateEthersProxyProps
} from './adapters/ethers'
import {
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  CreateProxyProps as CreateWeb3ProxyProps,
  Web3TransactionResult
} from './adapters/web3'

import { ContractNetworksConfig } from './types'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { standardizeSafeTransactionData } from './utils/transactions/utils'

export default Safe
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
  Web3Adapter,
  Web3AdapterConfig,
  Web3TransactionOptions,
  CreateWeb3ProxyProps,
  Web3TransactionResult
}

export * from './adapters/ethers/types'
export * from './adapters/web3/types'
