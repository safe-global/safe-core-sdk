import { narrow } from 'abitype'
import safe_1_0_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.0.0/gnosis_safe'
import SafeBaseContract from '../SafeBaseContract'

const safeContract_v1_0_0_AbiTypes = narrow(safe_1_0_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.0.0.
 *
 * @type {SafeContract_v1_0_0_Abi}
 */
export type SafeContract_v1_0_0_Abi = typeof safeContract_v1_0_0_AbiTypes

/**
 * Represents the contract type for a Safe contract version 1.0.0, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.0.0.
 *
 * @type {SafeContract_v1_0_0_Contract}
 */
type SafeContract_v1_0_0_Contract = SafeBaseContract<SafeContract_v1_0_0_Abi>

export default SafeContract_v1_0_0_Contract
