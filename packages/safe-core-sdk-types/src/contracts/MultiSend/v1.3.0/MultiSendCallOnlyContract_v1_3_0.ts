import { narrow } from 'abitype'
import multiSendCallOnly_1_3_0_ContractArtifacts from '../../assets/MultiSend/v1.3.0/multi_send_call_only'
import MultiSendCallOnlyBaseContract from '../MultiSendCallOnlyBaseContract'

const multiSendCallOnlyContract_v1_3_0_AbiTypes = narrow(
  multiSendCallOnly_1_3_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the MultiSendCallOnly contract version 1.3.0.
 *
 * @type {MultiSendCallOnlyContract_v1_3_0_Abi}
 */
export type MultiSendCallOnlyContract_v1_3_0_Abi = typeof multiSendCallOnlyContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a MultiSendCallOnly contract version 1.3.0 defining read and write methods.
 * Utilizes the generic MultiSendBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {MultiSendCallOnlyContract_v1_3_0_Contract}
 */
export type MultiSendCallOnlyContract_v1_3_0_Contract =
  MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_3_0_Abi>
