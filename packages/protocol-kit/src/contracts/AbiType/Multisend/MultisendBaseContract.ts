import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Encodes a function call for a MultiSend contract.
 *
 * @template MultiSendContractAbi - The ABI of the MultiSend contract.
 * @template MultiSendFunction - The function to encode, derived from the ABI.
 */
export type EncodeMultiSendFunction<
  MultiSendContractAbi extends Abi, // Abi of the Safe Contract,
  MultiSendFunction extends
    ExtractAbiFunctionNames<MultiSendContractAbi> = ExtractAbiFunctionNames<MultiSendContractAbi>
> = (
  functionToEncode: MultiSendFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<MultiSendContractAbi, MultiSendFunction>['inputs'],
    'inputs'
  >
) => string

export type GetAddressMultiSendFunction = () => Promise<string>

type MultiSendBaseContract<MultiSendContractAbi extends Abi> = {
  safeVersion: SafeVersion
  encode: EncodeMultiSendFunction<MultiSendContractAbi>
  getAddress: GetAddressMultiSendFunction
}

export default MultiSendBaseContract
