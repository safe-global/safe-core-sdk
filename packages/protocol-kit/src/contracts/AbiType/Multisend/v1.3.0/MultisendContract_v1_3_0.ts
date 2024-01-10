import { narrow } from 'abitype'
import multisend_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Multisend/v1.3.0/multi_send'
import MultisendBaseContract, {
  MultisendContractReadFunctions,
  MultisendContractWriteFunctions
} from '../MultisendBaseContract'

const multisendContract_v1_3_0_AbiTypes = narrow(multisend_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the Multisend contract version 1.3.0.
 *
 * @type {MultisendContract_v1_3_0_Abi}
 */
export type MultisendContract_v1_3_0_Abi = typeof multisendContract_v1_3_0_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the Multisend contract version 1.3.0.
 *
 * @type {Multisend_v1_3_0_Read_Functions}
 */
export type Multisend_v1_3_0_Read_Functions =
  MultisendContractReadFunctions<MultisendContract_v1_3_0_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the Multisend contract version 1.3.0.
 *
 * @type {Multisend_v1_3_0_Write_Functions}
 */
export type Multisend_v1_3_0_Write_Functions =
  MultisendContractWriteFunctions<MultisendContract_v1_3_0_Abi>

/**
 * Represents the contract type for a Multisend contract version 1.3.0 defining read and write methods.
 * Utilizes the generic MultisendBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {MultisendContract_v1_3_0_Contract}
 */
type MultisendContract_v1_3_0_Contract = MultisendBaseContract<MultisendContract_v1_3_0_Abi>

export default MultisendContract_v1_3_0_Contract
