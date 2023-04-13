import {
  CreateCallEthersContract,
  CreateProxyProps as CreateEthersProxyProps,
  EthersAdapter,
  EthersAdapterConfig,
  EthersTransactionOptions,
  EthersTransactionResult,
  GnosisSafeContractEthers,
  GnosisSafeProxyFactoryEthersContract,
  MultiSendCallOnlyEthersContract,
  MultiSendEthersContract,
  SignMessageLibEthersContract
} from './adapters/ethers'
import {
  CreateCallWeb3Contract,
  CreateProxyProps as CreateWeb3ProxyProps,
  GnosisSafeContractWeb3,
  GnosisSafeProxyFactoryWeb3Contract,
  MultiSendCallOnlyWeb3Contract,
  MultiSendWeb3Contract,
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
  calculateProxyAddress,
  getSafeInitializer,
  PREDETERMINED_SALT_NONCE
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import Safe from './Safe'
import SafeFactory, { DeploySafeProps, SafeFactoryConfig } from './safeFactory'
import {
  AddOwnerTxParams,
  ConnectSafeConfig,
  ContractNetworksConfig,
  CreateTransactionProps,
  PredictedSafeProps,
  RemoveOwnerTxParams,
  SafeAccountConfig,
  SafeConfig,
  SafeDeploymentConfig,
  SwapOwnerTxParams
} from './types'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { encodeMultiSendData, standardizeSafeTransactionData } from './utils/transactions/utils'

export {
  ContractManager,
  SafeFactory,
  SafeFactoryConfig,
  SafeAccountConfig,
  SafeDeploymentConfig,
  PredictedSafeProps,
  DeploySafeProps,
  SafeConfig,
  ConnectSafeConfig,
  ContractNetworksConfig,
  SafeTransactionOptionalProps,
  CreateTransactionProps,
  AddOwnerTxParams,
  RemoveOwnerTxParams,
  SwapOwnerTxParams,
  encodeMultiSendData,
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
  getCreateCallContract,
  getSafeInitializer,
  calculateProxyAddress,
  PREDETERMINED_SALT_NONCE
}

export default Safe
