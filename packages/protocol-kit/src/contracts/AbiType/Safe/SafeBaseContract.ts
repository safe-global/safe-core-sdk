import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers'
import { Web3TransactionOptions } from '@safe-global/protocol-kit/adapters/web3'
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from 'packages/safe-core-sdk-types/dist/src'

// see docs: https://abitype.dev/config
declare module 'abitype' {
  export interface Register {
    // AddressType: `0x${string}`
    // BytesType: {
    //   inputs: `0x${string}` | Uint8Array
    //   outputs: `0x${string}`
    // }
    AddressType: string
    BytesType: {
      inputs: string
      outputs: string
    }
  }
}

/**
 * Extracts the names of read-only functions (view or pure) from a given Safe contract ABI.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @type {SafeContractReadFunctions}
 */
export type SafeContractReadFunctions<SafeContractAbi extends Abi> = ExtractAbiFunctionNames<
  SafeContractAbi,
  'view' | 'pure'
>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given Safe contract ABI.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @type {SafeContractWriteFunctions}
 */
export type SafeContractWriteFunctions<SafeContractAbi extends Abi> = ExtractAbiFunctionNames<
  SafeContractAbi,
  'nonpayable' | 'payable'
>

/**
 * Encodes a function call for a Safe contract.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @template SafeFunction - The function to encode, derived from the ABI.
 */
export type EncodeSafeFunction<
  SafeContractAbi extends Abi, // Abi of the Safe Contract,
  SafeFunction extends ExtractAbiFunctionNames<SafeContractAbi> = ExtractAbiFunctionNames<SafeContractAbi>
> = (
  functionToEncode: SafeFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeContractAbi, SafeFunction>['inputs'],
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
  SafeContractAbi extends Abi, // Abi of the Safe Contract,
  TransactionOptions extends EthersTransactionOptions | Web3TransactionOptions,
  SafeFunction extends ExtractAbiFunctionNames<SafeContractAbi> = ExtractAbiFunctionNames<SafeContractAbi>
> = (
  functionToEncode: SafeFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeContractAbi, SafeFunction>['inputs'],
    'inputs'
  >,
  options?: TransactionOptions
) => Promise<bigint>

/**
 * Represents the base contract type for a Safe contract, defining read methods and utility functions like encode and estimateGas.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @type {SafeBaseContract}
 */
type SafeBaseContract<SafeContractAbi extends Abi> = {
  // only define Read methods
  [SafeFunction in SafeContractReadFunctions<SafeContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeContractAbi, SafeFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeContractAbi, SafeFunction>['outputs'],
      'outputs'
    >
  >
} & {
  safeVersion: SafeVersion
  encode: EncodeSafeFunction<SafeContractAbi>
  estimateGas: EstimateGasSafeFunction<
    SafeContractAbi,
    EthersTransactionOptions | Web3TransactionOptions
  >
}

export default SafeBaseContract
