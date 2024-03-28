import { narrow } from 'abitype'
import createCall_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CreateCall/v1.4.1/create_call'
import CreateCallBaseContract from '@safe-global/protocol-kit/contracts/AbiType/CreateCall/CreateCallBaseContract'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'

const createCallContract_v1_4_1_AbiTypes = narrow(createCall_1_4_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the CreateCall contract version 1.4.1.
 *
 * @type {CreateCallContract_v1_4_1_Abi}
 */
export type CreateCallContract_v1_4_1_Abi = typeof createCallContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a CreateCall contract version 1.4.1 defining read and write methods.
 * Utilizes the generic CreateCallBaseContract with the ABI specific to version 1.4.1.
 *
 * @template Adapter - The EthAdapter type to use.
 * @type {CreateCallContract_v1_4_1_Contract}
 */
type CreateCallContract_v1_4_1_Contract<Adapter extends EthAdapter> = CreateCallBaseContract<
  CreateCallContract_v1_4_1_Abi,
  Adapter
>

export default CreateCallContract_v1_4_1_Contract
