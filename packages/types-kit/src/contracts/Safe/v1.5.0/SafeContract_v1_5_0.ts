import { ExtractAbiFunctionNames, narrow } from 'abitype'
import safe_1_5_0_ContractArtifacts from '../../assets/Safe/v1.5.0/safe_l2'
import SafeBaseContract from '../SafeBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const safeContract_v1_5_0_AbiTypes = narrow(safe_1_5_0_ContractArtifacts.abi)

/**
 * Represents the ABI of the Safe contract version 1.5.0.
 *
 * @type {SafeContract_v1_5_0_Abi}
 */
export type SafeContract_v1_5_0_Abi = typeof safeContract_v1_5_0_AbiTypes

/**
 * Represents the function type derived by the given function name from the Safe contract version 1.5.0 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SafeContract_v1_5_0_Function}
 */
export type SafeContract_v1_5_0_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SafeContract_v1_5_0_Abi>
> = ContractFunction<SafeContract_v1_5_0_Abi, ContractFunctionName>

/**
 * Represents the contract type for a Safe contract version 1.5.0, defining read and write methods.
 * Utilizes the generic SafeBaseContract with the ABI specific to version 1.5.0.
 *
 * @type {SafeContract_v1_5_0_Contract}
 */
export type SafeContract_v1_5_0_Contract = SafeBaseContract<SafeContract_v1_5_0_Abi>
