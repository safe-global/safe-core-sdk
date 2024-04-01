import { narrow } from 'abitype'
import signMessageLib_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SignMessageLib/v1.3.0/sign_message_lib'
import SignMessageLibBaseContract from '../SignMessageLibBaseContract'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'

const signMessageLibContract_v1_3_0_AbiTypes = narrow(signMessageLib_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the SignMessageLib contract version 1.3.0.
 *
 * @type {SignMessageLibContract_v1_3_0_Abi}
 */
export type SignMessageLibContract_v1_3_0_Abi = typeof signMessageLibContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a SignMessageLib contract version 1.3.0 defining read and write methods.
 * Utilizes the generic SignMessageLibBaseContract with the ABI specific to version 1.3.0.
 *
 * @template Adapter - The EthAdapter type to use.
 * @type {SignMessageLibContract_v1_3_0_Contract}
 */
type SignMessageLibContract_v1_3_0_Contract<Adapter extends EthAdapter> =
  SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi, Adapter>

export default SignMessageLibContract_v1_3_0_Contract