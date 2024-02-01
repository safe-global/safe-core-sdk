import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers'
import { Web3TransactionOptions } from '@safe-global/protocol-kit/adapters/web3'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Extracts the names of read-only functions (view or pure) from a given Safe Proxy Factory contract ABI.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy factory contract.
 * @type {ProxyFactoryContractReadFunctions}
 */
export type ProxyFactoryContractReadFunctions<SafeProxyFactoryContractAbi extends Abi> =
  ExtractAbiFunctionNames<SafeProxyFactoryContractAbi, 'view' | 'pure'>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given Safe Proxy Factory contract ABI.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy Factory contract.
 * @type {ProxyFactoryContractWriteFunctions}
 */
export type ProxyFactoryContractWriteFunctions<SafeProxyFactoryContractAbi extends Abi> =
  ExtractAbiFunctionNames<SafeProxyFactoryContractAbi, 'nonpayable' | 'payable'>

/**
 * Encodes a function call for a Safe Proxy Factory contract.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy Factory contract.
 * @template ProxyFactoryFunction - The function to encode, derived from the ABI.
 */
export type EncodeSafeProxyFactoryFunction<
  SafeProxyFactoryContractAbi extends Abi,
  ProxyFactoryFunction extends
    ExtractAbiFunctionNames<SafeProxyFactoryContractAbi> = ExtractAbiFunctionNames<SafeProxyFactoryContractAbi>
> = (
  functionToEncode: ProxyFactoryFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeProxyFactoryContractAbi, ProxyFactoryFunction>['inputs'],
    'inputs'
  >
) => string

/**
 * Estimates the gas required for a function call on a Safe Proxy Factory contract.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy Factory contract.
 * @template ProxyFactoryFunction - The function for which gas is being estimated, derived from the ABI.
 */
export type EstimateGasSafeProxyFactoryFunction<
  SafeProxyFactoryContractAbi extends Abi, // Abi of the Safe Proxy Factory Contract,
  TransactionOptions extends EthersTransactionOptions | Web3TransactionOptions,
  ProxyFactoryFunction extends
    ExtractAbiFunctionNames<SafeProxyFactoryContractAbi> = ExtractAbiFunctionNames<SafeProxyFactoryContractAbi>
> = (
  functionToEncode: ProxyFactoryFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeProxyFactoryContractAbi, ProxyFactoryFunction>['inputs'],
    'inputs'
  >,
  options?: TransactionOptions
) => Promise<bigint>

/**
 * Represents the base contract type for a Safe Proxy Factory contract.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy factory contract.
 * @type {SafeBaseProxyFactoryContract}
 */
type SafeBaseProxyFactoryContract<SafeProxyFactoryContractAbi extends Abi> = {
  [ProxyFactoryFunction in
    | ProxyFactoryContractReadFunctions<SafeProxyFactoryContractAbi>
    | ProxyFactoryContractWriteFunctions<SafeProxyFactoryContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeProxyFactoryContractAbi, ProxyFactoryFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeProxyFactoryContractAbi, ProxyFactoryFunction>['outputs'],
      'outputs'
    >
  >
} & {
  safeVersion: SafeVersion
  encode: EncodeSafeProxyFactoryFunction<SafeProxyFactoryContractAbi>
  estimateGas: EstimateGasSafeProxyFactoryFunction<
    SafeProxyFactoryContractAbi,
    EthersTransactionOptions | Web3TransactionOptions
  >
}

export default SafeBaseProxyFactoryContract
