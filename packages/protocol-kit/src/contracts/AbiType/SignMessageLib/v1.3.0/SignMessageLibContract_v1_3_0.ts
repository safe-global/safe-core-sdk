import { narrow } from 'abitype'
import signMessageLib_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SignMessageLib/v1.3.0/sign_message_lib'
import SignMessageLibBaseContract, {
  SignMessageLibContractReadFunctions,
  SignMessageLibContractWriteFunctions
} from '../SignMessageLibBaseContract'

const signMessageLibContract_v1_3_0_AbiTypes = narrow(signMessageLib_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the SignMessageLib contract version 1.3.0.
 *
 * @type {SignMessageLibContract_v1_3_0_Abi}
 */
export type SignMessageLibContract_v1_3_0_Abi = typeof signMessageLibContract_v1_3_0_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the SignMessageLib contract version 1.3.0.
 *
 * @type {SignMessageLib_v1_3_0_Read_Functions}
 */
export type SignMessageLib_v1_3_0_Read_Functions =
  SignMessageLibContractReadFunctions<SignMessageLibContract_v1_3_0_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the SignMessageLib contract version 1.3.0.
 *
 * @type {SignMessageLib_v1_3_0_Write_Functions}
 */
export type SignMessageLib_v1_3_0_Write_Functions =
  SignMessageLibContractWriteFunctions<SignMessageLibContract_v1_3_0_Abi>

/**
 * Represents the contract type for a SignMessageLib contract version 1.3.0 defining read and write methods.
 * Utilizes the generic SignMessageLibBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {SignMessageLibContract_v1_3_0_Contract}
 */
type SignMessageLibContract_v1_3_0_Contract =
  SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi>

export default SignMessageLibContract_v1_3_0_Contract
