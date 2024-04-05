import { narrow } from 'abitype'
import safe_1_4_1_ContractArtifacts from '../../assets/Safe/v1.4.1/safe_l2'
import SafeBaseContract from '../SafeBaseContract'

const safeContract_v1_4_1_AbiTypes = narrow(safe_1_4_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.4.1.
 *
 * @type {SafeContract_v1_4_1_Abi}
 */
export type SafeContract_v1_4_1_Abi = typeof safeContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a Safe contract version 1.4.1, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SafeContract_v1_4_1_Contract}
 */
export type SafeContract_v1_4_1_Contract = SafeBaseContract<SafeContract_v1_4_1_Abi>
