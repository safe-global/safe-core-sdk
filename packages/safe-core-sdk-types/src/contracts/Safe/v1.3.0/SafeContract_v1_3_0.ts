import { narrow } from 'abitype'
import safe_1_3_0_ContractArtifacts from '../../assets/Safe/v1.3.0/gnosis_safe_l2'
import SafeBaseContract from '../SafeBaseContract'

const safeContract_v1_3_0_AbiTypes = narrow(safe_1_3_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.3.0.
 *
 * @type {SafeContract_v1_3_0_Abi}
 */
export type SafeContract_v1_3_0_Abi = typeof safeContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a Safe contract version 1.3.0, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {SafeContract_v1_3_0_Contract}
 */
export type SafeContract_v1_3_0_Contract = SafeBaseContract<SafeContract_v1_3_0_Abi>
