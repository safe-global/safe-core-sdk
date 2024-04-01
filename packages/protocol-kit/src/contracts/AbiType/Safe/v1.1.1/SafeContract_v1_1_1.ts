import { narrow } from 'abitype'
import safe_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.1.1/gnosis_safe'
import SafeBaseContract from '../SafeBaseContract'

const safeContract_v1_1_1_AbiTypes = narrow(safe_1_1_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.1.1.
 *
 * @type {SafeContract_v1_1_1_Abi}
 */
export type SafeContract_v1_1_1_Abi = typeof safeContract_v1_1_1_AbiTypes

/**
 * Represents the contract type for a Safe contract version 1.1.1, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.1.1.
 *
 * @type {SafeContract_v1_1_1_Contract}
 */
type SafeContract_v1_1_1_Contract = SafeBaseContract<SafeContract_v1_1_1_Abi>

export default SafeContract_v1_1_1_Contract