import { narrow } from 'abitype'
import createCall_1_3_0_ContractArtifacts from '../../assets/CreateCall/v1.3.0/create_call'
import CreateCallBaseContract from '../CreateCallBaseContract'

const createCallContract_v1_3_0_AbiTypes = narrow(createCall_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the CreateCall contract version 1.3.0.
 *
 * @type {CreateCallContract_v1_3_0_Abi}
 */
export type CreateCallContract_v1_3_0_Abi = typeof createCallContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a CreateCall contract version 1.3.0 defining read and write methods.
 * Utilizes the generic CreateCallBaseContract with the ABI specific to version 1.3.0.
 * @type {CreateCallContract_v1_3_0_Contract}
 */
export type CreateCallContract_v1_3_0_Contract =
  CreateCallBaseContract<CreateCallContract_v1_3_0_Abi>
