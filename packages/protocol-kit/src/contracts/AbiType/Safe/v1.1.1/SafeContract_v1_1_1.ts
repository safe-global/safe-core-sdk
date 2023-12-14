import { narrow } from 'abitype'
import safe_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.1.1/gnosis_safe'
import SafeBaseContract, {
  SafeContractReadFunctions,
  SafeContractWriteFunctions
} from '../SafeBaseContract'

const safeContract_v1_1_1_AbiTypes = narrow(safe_1_1_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.1.1.
 *
 * @type {SafeContract_v1_1_1_Abi}
 */
export type SafeContract_v1_1_1_Abi = typeof safeContract_v1_1_1_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the Safe contract version 1.1.1.
 *
 * @type {Safe_v1_1_1_Read_Functions}
 */
export type Safe_v1_1_1_Read_Functions = SafeContractReadFunctions<SafeContract_v1_1_1_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the Safe contract version 1.1.1.
 *
 * @type {Safe_v1_1_1_Write_Functions}
 */
export type Safe_v1_1_1_Write_Functions = SafeContractWriteFunctions<SafeContract_v1_1_1_Abi>

/**
 * Represents the contract type for a Safe contract version 1.1.1, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.1.1.
 *
 * @type {SafeContract_v1_1_1_Contract}
 */
type SafeContract_v1_1_1_Contract = SafeBaseContract<SafeContract_v1_1_1_Abi>

export default SafeContract_v1_1_1_Contract
