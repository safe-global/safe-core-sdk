import { ExtractAbiFunctionNames, narrow } from 'abitype'
import extensibleFallbackHandler_1_5_0_ContractArtifacts from '../../assets/ExtensibleFallbackHandler/v1.5.0/extensible_fallback_handler'
import ExtensibleFallbackHandlerBaseContract from '../ExtensibleFallbackHandlerBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const extensibleFallbackHandlerContract_v1_5_0_AbiTypes = narrow(
  extensibleFallbackHandler_1_5_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the ExtensibleFallbackHandler contract version 1.5.0.
 *
 * @type {ExtensibleFallbackHandlerContract_v1_5_0_Abi}
 */
export type ExtensibleFallbackHandlerContract_v1_5_0_Abi =
  typeof extensibleFallbackHandlerContract_v1_5_0_AbiTypes

/**
 * Represents the function type derived by the given function name from the ExtensibleFallbackHandler contract version 1.5.0 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {ExtensibleFallbackHandlerContract_v1_5_0_Function}
 */
export type ExtensibleFallbackHandlerContract_v1_5_0_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
> = ContractFunction<ExtensibleFallbackHandlerContract_v1_5_0_Abi, ContractFunctionName>

/**
 * Represents the contract type for an ExtensibleFallbackHandler contract version 1.5.0 defining read and write methods.
 * Utilizes the generic ExtensibleFallbackHandlerBaseContract with the ABI specific to version 1.5.0.
 *
 * @type {ExtensibleFallbackHandlerContract_v1_5_0_Contract}
 */
export type ExtensibleFallbackHandlerContract_v1_5_0_Contract =
  ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
