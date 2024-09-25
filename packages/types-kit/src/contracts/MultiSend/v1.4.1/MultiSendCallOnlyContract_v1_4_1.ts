import { narrow } from 'abitype'
import multiSendCallOnly_1_4_1_ContractArtifacts from '../../assets/MultiSend/v1.4.1/multi_send_call_only'
import MultiSendCallOnlyBaseContract from '../MultiSendCallOnlyBaseContract'

const multiSendCallOnlyContract_v1_4_1_AbiTypes = narrow(
  multiSendCallOnly_1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the MultiSendCallOnly contract version 1.4.1.
 *
 * @type {MultiSendCallOnlyContract_v1_4_1_Abi}
 */
export type MultiSendCallOnlyContract_v1_4_1_Abi = typeof multiSendCallOnlyContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a MultiSendCallOnly contract version 1.4.1 defining read and write methods.
 * Utilizes the generic MultiSendBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {MultiSendCallOnlyContract_v1_4_1_Contract}
 */
export type MultiSendCallOnlyContract_v1_4_1_Contract =
  MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_4_1_Abi>
