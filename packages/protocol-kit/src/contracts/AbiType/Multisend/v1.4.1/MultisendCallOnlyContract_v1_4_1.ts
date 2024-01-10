import { narrow } from 'abitype'
import multisendCallOnly_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Multisend/v1.4.1/multi_send_call_only'
import MultisendBaseContract, {
  MultisendContractReadFunctions,
  MultisendContractWriteFunctions
} from '../MultisendBaseContract'

const multisendCallOnlyContract_v1_4_1_AbiTypes = narrow(
  multisendCallOnly_1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the MultisendCallOnly contract version 1.4.1.
 *
 * @type {MultisendCallOnlyContract_v1_4_1_Abi}
 */
export type MultisendCallOnlyContract_v1_4_1_Abi = typeof multisendCallOnlyContract_v1_4_1_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the MultisendCallOnly contract version 1.4.1.
 *
 * @type {MultisendCallOnly_v1_4_1_Read_Functions}
 */
export type MultisendCallOnly_v1_4_1_Read_Functions =
  MultisendContractReadFunctions<MultisendCallOnlyContract_v1_4_1_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the MultisendCallOnly contract version 1.4.1.
 *
 * @type {MultisendCallOnly_v1_4_1_Write_Functions}
 */
export type MultisendCallOnly_v1_4_1_Write_Functions =
  MultisendContractWriteFunctions<MultisendCallOnlyContract_v1_4_1_Abi>

/**
 * Represents the contract type for a MultisendCallOnly contract version 1.4.1 defining read and write methods.
 * Utilizes the generic MultisendBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {MultisendCallOnlyContract_v1_4_1_Contract}
 */
type MultisendCallOnlyContract_v1_4_1_Contract =
  MultisendBaseContract<MultisendCallOnlyContract_v1_4_1_Abi>

export default MultisendCallOnlyContract_v1_4_1_Contract
