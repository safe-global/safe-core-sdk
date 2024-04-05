import { narrow } from 'abitype'
import signMessageLib_1_4_1_ContractArtifacts from '../../assets/SignMessageLib/v1.4.1/sign_message_lib'
import SignMessageLibBaseContract from '../SignMessageLibBaseContract'

const signMessageLibContract_v1_4_1_AbiTypes = narrow(signMessageLib_1_4_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the SignMessageLib contract version 1.4.1.
 *
 * @type {SignMessageLibContract_v1_4_1_Abi}
 */
export type SignMessageLibContract_v1_4_1_Abi = typeof signMessageLibContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a SignMessageLib contract version 1.4.1 defining read and write methods.
 * Utilizes the generic SignMessageLibBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SignMessageLibContract_v1_4_1_Contract}
 */
export type SignMessageLibContract_v1_4_1_Contract =
  SignMessageLibBaseContract<SignMessageLibContract_v1_4_1_Abi>
