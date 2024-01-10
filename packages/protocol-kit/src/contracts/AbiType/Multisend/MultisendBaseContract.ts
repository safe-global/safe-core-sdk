import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'

/**
 * Extracts the names of read-only functions (view or pure) from a given Multisend contract ABI.
 *
 * @template MultiSendContractAbi - The ABI of the Safe contract.
 * @type {MultisendContractReadFunctions}
 */
export type MultisendContractReadFunctions<MultiSendContractAbi extends Abi> =
  ExtractAbiFunctionNames<MultiSendContractAbi, 'view' | 'pure'>

/**
 * Extracts the names of write functions (nonpayable or payable) from a given Multisend contract ABI.
 *
 * @template MultiSendContractAbi - The ABI of the Multisend contract.
 * @type {MultisendContractWriteFunctions}
 */
export type MultisendContractWriteFunctions<MultiSendContractAbi extends Abi> =
  ExtractAbiFunctionNames<MultiSendContractAbi, 'nonpayable' | 'payable'>

type MultiSendBaseContract<MultiSendContractAbi extends Abi> = {
  [MultisendFunction in MultisendContractWriteFunctions<MultiSendContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<MultiSendContractAbi, MultisendFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<MultiSendContractAbi, MultisendFunction>['outputs'],
      'outputs'
    >
  >
} & {
  [MultisendFunction in MultisendContractReadFunctions<MultiSendContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<MultiSendContractAbi, MultisendFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<MultiSendContractAbi, MultisendFunction>['outputs'],
      'outputs'
    >
  >
}

export default MultiSendBaseContract
