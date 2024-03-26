import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Extracts the names of read-only functions (view or pure) from a given SimulateTxAccessor contract ABI.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @type {SimulateTxAccessorContractReadFunctions}
 */
export type SimulateTxAccessorContractReadFunctions<SimulateTxAccessorContractAbi extends Abi> =
  ExtractAbiFunctionNames<SimulateTxAccessorContractAbi, 'view' | 'pure'>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given SimulateTxAccessor contract ABI.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @type {SimulateTxAccessorContractWriteFunctions}
 */
export type SimulateTxAccessorContractWriteFunctions<SimulateTxAccessorContractAbi extends Abi> =
  ExtractAbiFunctionNames<SimulateTxAccessorContractAbi, 'nonpayable' | 'payable'>

/**
 * Encodes a function call for a SimulateTxAccessor contract.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @template SimulateTxAccessorFunction - The function to encode, derived from the ABI.
 */
export type EncodeSimulateTxAccessorFunction<
  SimulateTxAccessorContractAbi extends Abi,
  SimulateTxAccessorFunction extends
    ExtractAbiFunctionNames<SimulateTxAccessorContractAbi> = ExtractAbiFunctionNames<SimulateTxAccessorContractAbi>
> = (
  functionToEncode: SimulateTxAccessorFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SimulateTxAccessorContractAbi, SimulateTxAccessorFunction>['inputs'],
    'inputs'
  >
) => string

export type GetAddressSimulateTxAccessorFunction = () => Promise<string>

/**
 * Represents the base contract type for a SimulateTxAccessor contract.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @type {SimulateTxAccessorBaseContract}
 */
type SimulateTxAccessorBaseContract<SimulateTxAccessorContractAbi extends Abi> = {
  [SimulateTxAccessorFunction in
    | SimulateTxAccessorContractReadFunctions<SimulateTxAccessorContractAbi>
    | SimulateTxAccessorContractWriteFunctions<SimulateTxAccessorContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SimulateTxAccessorContractAbi, SimulateTxAccessorFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SimulateTxAccessorContractAbi, SimulateTxAccessorFunction>['outputs'],
      'outputs'
    >
  >
} & {
  safeVersion: SafeVersion
  getAddress: GetAddressSimulateTxAccessorFunction
  encode: EncodeSimulateTxAccessorFunction<SimulateTxAccessorContractAbi>
}

export default SimulateTxAccessorBaseContract
