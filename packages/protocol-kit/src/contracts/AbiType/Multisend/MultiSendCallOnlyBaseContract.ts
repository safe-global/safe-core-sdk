import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Encodes a function call for a MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbi - The ABI of the MultiSendCallOnly contract.
 * @template MultiSendCallOnlyFunction - The function to encode, derived from the ABI.
 */
export type EncodeMultiSendCallOnlyFunction<
  MultiSendCallOnlyContractAbi extends Abi, // Abi of the Safe Contract,
  MultiSendCallOnlyFunction extends
    ExtractAbiFunctionNames<MultiSendCallOnlyContractAbi> = ExtractAbiFunctionNames<MultiSendCallOnlyContractAbi>
> = (
  functionToEncode: MultiSendCallOnlyFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<MultiSendCallOnlyContractAbi, MultiSendCallOnlyFunction>['inputs'],
    'inputs'
  >
) => string

export type GetAddressMultiSendCallOnlyFunction = () => Promise<string>

type MultiSendCallOnlyBaseContract<MultiSendCallOnlyContractAbi extends Abi> = {
  safeVersion: SafeVersion
  encode: EncodeMultiSendCallOnlyFunction<MultiSendCallOnlyContractAbi>
  getAddress: GetAddressMultiSendCallOnlyFunction
}

export default MultiSendCallOnlyBaseContract
