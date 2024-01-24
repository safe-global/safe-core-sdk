import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers'
import { Web3TransactionOptions } from '@safe-global/protocol-kit/adapters/web3'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Extracts the names of read-only functions (view or pure) from a given SignMessageLib contract ABI.
 *
 * @template SignMessageLibContractAbi - The ABI of the SignMessageLib contract.
 * @type {SignMessageLibContractReadFunctions}
 */
export type SignMessageLibContractReadFunctions<SignMessageLibContractAbi extends Abi> =
  ExtractAbiFunctionNames<SignMessageLibContractAbi, 'view' | 'pure'>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given SignMessageLib contract ABI.
 *
 * @template SignMessageLibContractAbi - The ABI of the SignMessageLib contract.
 * @type {SignMessageLibContractWriteFunctions}
 */
export type SignMessageLibContractWriteFunctions<SignMessageLibContractAbi extends Abi> =
  ExtractAbiFunctionNames<SignMessageLibContractAbi, 'nonpayable' | 'payable'>

/**
 * Encodes a function call for a SignMessageLib contract.
 *
 * @template SignMessageLibContractAbi - The ABI of the SignMessageLib contract.
 * @template SignMessageLibFunction - The function to encode, derived from the ABI.
 */
export type EncodeSignMessageLibFunction<
  SignMessageLibContractAbi extends Abi, // Abi of the SignMessageLib Contract,
  SignMessageLibFunction extends
    ExtractAbiFunctionNames<SignMessageLibContractAbi> = ExtractAbiFunctionNames<SignMessageLibContractAbi>
> = (
  functionToEncode: SignMessageLibFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SignMessageLibContractAbi, SignMessageLibFunction>['inputs'],
    'inputs'
  >
) => string

/**
 * Estimates the gas required for a function call on a Safe contract.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @template SafeFunction - The function for which gas is being estimated, derived from the ABI.
 */
export type EstimateGasSafeFunction<
  SignMessageLibContractAbi extends Abi, // Abi of the Safe Contract,
  TransactionOptions extends EthersTransactionOptions | Web3TransactionOptions,
  SafeFunction extends
    ExtractAbiFunctionNames<SignMessageLibContractAbi> = ExtractAbiFunctionNames<SignMessageLibContractAbi>
> = (
  functionToEncode: SafeFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SignMessageLibContractAbi, SafeFunction>['inputs'],
    'inputs'
  >,
  options?: TransactionOptions
) => Promise<bigint>

export type GetAddressSignMessageLibFunction = () => Promise<string>

type SignMessageLibBaseContract<SignMessageLibContractAbi extends Abi> = {
  // Read functions
  [SafeFunction in SignMessageLibContractReadFunctions<SignMessageLibContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SignMessageLibContractAbi, SafeFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SignMessageLibContractAbi, SafeFunction>['outputs'],
      'outputs'
    >
  >
} & {
  // Write functions
  [SafeFunction in SignMessageLibContractWriteFunctions<SignMessageLibContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SignMessageLibContractAbi, SafeFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SignMessageLibContractAbi, SafeFunction>['outputs'],
      'outputs'
    >
  >
} & {
  safeVersion: SafeVersion
  encode: EncodeSignMessageLibFunction<SignMessageLibContractAbi>
  getAddress: GetAddressSignMessageLibFunction
  estimateGas: EstimateGasSafeFunction<
    SignMessageLibContractAbi,
    EthersTransactionOptions | Web3TransactionOptions
  >
}

export default SignMessageLibBaseContract
