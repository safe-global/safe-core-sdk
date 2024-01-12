import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

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

/**
 * Encodes a function call for a Multisend contract.
 *
 * @template MultiSendContractAbi - The ABI of the Multisend contract.
 * @template MultisendFunction - The function to encode, derived from the ABI.
 */
export type EncodeMultiSendFunction<
  MultiSendContractAbi extends Abi, // Abi of the Safe Contract,
  MultisendFunction extends
    ExtractAbiFunctionNames<MultiSendContractAbi> = ExtractAbiFunctionNames<MultiSendContractAbi>
> = (
  functionToEncode: MultisendFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<MultiSendContractAbi, MultisendFunction>['inputs'],
    'inputs'
  >
) => string

export type GetAddressFunction = () => Promise<string>

type MultiSendBaseContract<MultiSendContractAbi extends Abi> = {
  safeVersion: SafeVersion
  encode: EncodeMultiSendFunction<MultiSendContractAbi>
  getAddress: GetAddressFunction
}

export default MultiSendBaseContract
