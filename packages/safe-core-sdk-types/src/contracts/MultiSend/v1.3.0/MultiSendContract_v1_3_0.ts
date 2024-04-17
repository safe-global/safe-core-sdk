import { narrow } from 'abitype'
import multiSend_1_3_0_ContractArtifacts from '../../assets/MultiSend/v1.3.0/multi_send'
import MultiSendBaseContract from '../MultiSendBaseContract'

const multiSendContract_v1_3_0_AbiTypes = narrow(multiSend_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the MultiSend contract version 1.3.0.
 *
 * @type {MultiSendContract_v1_3_0_Abi}
 */
export type MultiSendContract_v1_3_0_Abi = typeof multiSendContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a MultiSend contract version 1.3.0 defining read and write methods.
 * Utilizes the generic MultiSendBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {MultiSendContract_v1_3_0_Contract}
 */
export type MultiSendContract_v1_3_0_Contract = MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
