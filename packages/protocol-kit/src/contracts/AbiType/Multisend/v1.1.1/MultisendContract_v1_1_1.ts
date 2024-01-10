import { narrow } from 'abitype'
import multisend_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Multisend/v1.1.1/multi_send'
import MultisendBaseContract, {
  MultisendContractReadFunctions,
  MultisendContractWriteFunctions
} from '../MultisendBaseContract'

const multisendContract_v1_1_1_AbiTypes = narrow(multisend_1_1_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the Multisend contract version 1.1.1.
 *
 * @type {MultisendContract_v1_1_1_Abi}
 */
export type MultisendContract_v1_1_1_Abi = typeof multisendContract_v1_1_1_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the Multisend contract version 1.1.1.
 *
 * @type {Multisend_v1_1_1_Read_Functions}
 */
export type Multisend_v1_1_1_Read_Functions =
  MultisendContractReadFunctions<MultisendContract_v1_1_1_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the Multisend contract version 1.1.1.
 *
 * @type {Multisend_v1_1_1_Write_Functions}
 */
export type Multisend_v1_1_1_Write_Functions =
  MultisendContractWriteFunctions<MultisendContract_v1_1_1_Abi>

/**
 * Represents the contract type for a Multisend contract version 1.1.1 defining read and write methods.
 * Utilizes the generic MultisendBaseContract with the ABI specific to version 1.1.1.
 *
 * @type {MultisendContract_v1_1_1_Contract}
 */
type MultisendContract_v1_1_1_Contract = MultisendBaseContract<MultisendContract_v1_1_1_Abi>

export default MultisendContract_v1_1_1_Contract
