import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion, TransactionOptions, TransactionResult } from '@safe-global/types-kit/types'

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
 * Extracts the function arguments from a given contract ABI and function name.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name to extract arguments from, derived from the ABI.
 * @template ArgType - The type of arguments to extract, either 'inputs' or 'outputs'. (default: 'inputs')
 * @type {ExtractFunctionArgs}
 */
export type ExtractFunctionArgs<
  ContractAbi extends Abi,
  ContractFunctionName extends ExtractAbiFunctionNames<ContractAbi> =
    ExtractAbiFunctionNames<ContractAbi>,
  ArgType extends 'inputs' | 'outputs' = 'inputs'
> = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<ContractAbi, ContractFunctionName>[ArgType],
  ArgType
>

/**
 * Encodes a function call for a contract.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name to encode, derived from the ABI.
 */
export type EncodeFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends ExtractAbiFunctionNames<ContractAbi> =
    ExtractAbiFunctionNames<ContractAbi>
> = (
  functionToEncode: ContractFunctionName,
  args: ExtractFunctionArgs<ContractAbi, ContractFunctionName>
) => string

/**
 * Estimates the gas required for a function call on a contract.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function for which gas is being estimated, derived from the ABI.
 */
export type EstimateGasFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends ExtractAbiFunctionNames<ContractAbi> =
    ExtractAbiFunctionNames<ContractAbi>
> = (
  functionToEncode: ContractFunctionName,
  args: ExtractFunctionArgs<ContractAbi, ContractFunctionName>,
  options?: TransactionOptions
) => Promise<bigint>

export type GetAddressFunction = () => string

/**
 * Defines a function type for a contract, derived by the given function name from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name, derived from the ABI.
 */
export type ContractFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends ExtractAbiFunctionNames<ContractAbi> =
    ExtractAbiFunctionNames<ContractAbi>
> = (
  // input parameters (only if function has inputs, otherwise no parameters)
  ...args: ExtractFunctionArgs<ContractAbi, ContractFunctionName>['length'] extends 0
    ? []
    : [ExtractFunctionArgs<ContractAbi, ContractFunctionName>]
  // returned values as a Promise
) => Promise<ExtractFunctionArgs<ContractAbi, ContractFunctionName, 'outputs'>>

/**
 * Defines an adapter-specific function type for a contract, derived by the given function name from a given contract ABI.
 *
 * @template ContractAbi - The ABI of the contract.
 * @template ContractFunctionName - The function name, derived from the ABI.
 */
export type SafeContractFunction<
  ContractAbi extends Abi,
  ContractFunctionName extends ExtractAbiFunctionNames<ContractAbi> =
    ExtractAbiFunctionNames<ContractAbi>
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
