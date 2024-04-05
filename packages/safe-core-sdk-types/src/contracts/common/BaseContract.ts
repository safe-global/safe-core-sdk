import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types/types'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/safe-core-sdk-types/ethereumLibs/ethers/types'
import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/safe-core-sdk-types/ethereumLibs/web3/types'

/**
 * Extracts the names of read-only functions (view or pure) from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @type {ContractReadFunctionNames}
 */
export type ContractReadFunctionNames<ContractAbi extends Abi> = ExtractAbiFunctionNames<
  ContractAbi,
  'view' | 'pure'
>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @type {ContractWriteFunctionNames}
 */
export type ContractWriteFunctionNames<ContractAbi extends Abi> = ExtractAbiFunctionNames<
  ContractAbi,
  'nonpayable' | 'payable'
>

/**
 * Encodes a function call for a contract.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name to encode, derived from the ABI.
 */
export type EncodeFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends
    ExtractAbiFunctionNames<ContractAbi> = ExtractAbiFunctionNames<ContractAbi>
> = (
  functionToEncode: ContractFunctionName,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<ContractAbi, ContractFunctionName>['inputs'],
    'inputs'
  >
) => string

/**
 * Estimates the gas required for a function call on a contract.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template TransactionOptions - The transaction options object.
 * @template ContractFunctionName - The function for which gas is being estimated, derived from the ABI.
 */
export type EstimateGasFunction<
  ContractAbi extends Abi,
  TransactionOptions extends EthersTransactionOptions | Web3TransactionOptions =
    | EthersTransactionOptions
    | Web3TransactionOptions,
  ContractFunctionName extends
    ExtractAbiFunctionNames<ContractAbi> = ExtractAbiFunctionNames<ContractAbi>
> = (
  functionToEncode: ContractFunctionName,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<ContractAbi, ContractFunctionName>['inputs'],
    'inputs'
  >,
  options?: TransactionOptions
) => Promise<bigint>

export type GetAddressFunction = () => Promise<string>

/**
 * Defines a function type for a contract, derived by the given function name from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name, derived from the ABI.
 */
export type ContractFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends
    ExtractAbiFunctionNames<ContractAbi> = ExtractAbiFunctionNames<ContractAbi>
> = (
  // parameters
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<ContractAbi, ContractFunctionName>['inputs'],
    'inputs'
  >
  // returned values as a Promise
) => Promise<
  AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<ContractAbi, ContractFunctionName>['outputs'],
    'outputs'
  >
>

/**
 * Defines an adapter-specific function type for a contract, derived by the given function name from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @template TransactionOptions - The transaction options type depending on the Adapter.
 * @template TransactionResult - The transaction result type depending on the Adapter.
 */
export type AdapterSpecificContractFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends
    ExtractAbiFunctionNames<ContractAbi> = ExtractAbiFunctionNames<ContractAbi>,
  TransactionOptions extends EthersTransactionOptions | Web3TransactionOptions =
    | EthersTransactionOptions
    | Web3TransactionOptions,
  TransactionResult extends EthersTransactionResult | Web3TransactionResult =
    | EthersTransactionResult
    | Web3TransactionResult
> = (
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<ContractAbi, ContractFunctionName>['inputs']
  >,
  options?: TransactionOptions
) => Promise<TransactionResult>

/**
 * Represents the base contract type for a contract.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionNames - The function names, derived from the ABI.
 * @type {BaseContract}
 */
type BaseContract<
  ContractAbi extends Abi,
  ContractFunctionNames extends ExtractAbiFunctionNames<ContractAbi> =
    | ContractReadFunctionNames<ContractAbi>
    | ContractWriteFunctionNames<ContractAbi>
> = {
  [FunctionName in ContractFunctionNames]: ContractFunction<ContractAbi, FunctionName>
} & {
  safeVersion: SafeVersion
  encode: EncodeFunction<ContractAbi>
  getAddress: GetAddressFunction
}

export default BaseContract
