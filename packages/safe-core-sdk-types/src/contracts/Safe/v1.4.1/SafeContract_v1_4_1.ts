import { ExtractAbiFunctionNames, narrow } from 'abitype'
import safe_1_4_1_ContractArtifacts from '../../assets/Safe/v1.4.1/safe_l2'
import SafeBaseContract from '../SafeBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const safeContract_v1_4_1_AbiTypes = narrow(safe_1_4_1_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.4.1.
 *
 * @type {SafeContract_v1_4_1_Abi}
 */
export type SafeContract_v1_4_1_Abi = typeof safeContract_v1_4_1_AbiTypes

/**
 * Represents the function type derived by the given function name from the Safe contract version 1.4.1 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SafeContract_v1_4_1_Function}
 */
export type SafeContract_v1_4_1_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SafeContract_v1_4_1_Abi>
> = ContractFunction<SafeContract_v1_4_1_Abi, ContractFunctionName>

/**
 * Represents the contract type for a Safe contract version 1.4.1, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SafeContract_v1_4_1_Contract}
 */
export type SafeContract_v1_4_1_Contract = SafeBaseContract<SafeContract_v1_4_1_Abi>
