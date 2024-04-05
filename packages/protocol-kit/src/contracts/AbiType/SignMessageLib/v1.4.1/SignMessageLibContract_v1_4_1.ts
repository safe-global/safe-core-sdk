import { ExtractAbiFunctionNames, narrow } from 'abitype'
import signMessageLib_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SignMessageLib/v1.4.1/sign_message_lib'
import SignMessageLibBaseContract from '../SignMessageLibBaseContract'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import { ContractFunction } from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

const signMessageLibContract_v1_4_1_AbiTypes = narrow(signMessageLib_1_4_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the SignMessageLib contract version 1.4.1.
 *
 * @type {SignMessageLibContract_v1_4_1_Abi}
 */
export type SignMessageLibContract_v1_4_1_Abi = typeof signMessageLibContract_v1_4_1_AbiTypes

/**
 * Represents the function type derived by the given function name from the SignMessageLib contract version 1.4.1 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SignMessageLibContract_v1_4_1_Function}
 */
export type SignMessageLibContract_v1_4_1_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SignMessageLibContract_v1_4_1_Abi>
> = ContractFunction<SignMessageLibContract_v1_4_1_Abi, ContractFunctionName>

/**
 * Represents the contract type for a SignMessageLib contract version 1.4.1 defining read and write methods.
 * Utilizes the generic SignMessageLibBaseContract with the ABI specific to version 1.4.1.
 *
 * @template Adapter - The EthAdapter type to use.
 * @type {SignMessageLibContract_v1_4_1_Contract}
 */
type SignMessageLibContract_v1_4_1_Contract<Adapter extends EthAdapter> =
  SignMessageLibBaseContract<SignMessageLibContract_v1_4_1_Abi, Adapter>

export default SignMessageLibContract_v1_4_1_Contract
