import { narrow } from 'abitype'
import compatibilityFallbackHandler_1_4_1_ContractArtifacts from '../../assets/CompatibilityFallbackHandler/v1.4.1/compatibility_fallback_handler'
import CompatibilityFallbackHandlerBaseContract from '../CompatibilityFallbackHandlerBaseContract'

const compatibilityFallbackHandlerContract_v1_4_1_AbiTypes = narrow(
  compatibilityFallbackHandler_1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the CompatibilityFallbackHandler contract version 1.4.1.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_4_1_Abi}
 */
export type CompatibilityFallbackHandlerContract_v1_4_1_Abi =
  typeof compatibilityFallbackHandlerContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a CompatibilityFallbackHandler contract version 1.4.1 defining read and write methods.
 * Utilizes the generic CompatibilityFallbackHandlerBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_4_1_Contract}
 */
export type CompatibilityFallbackHandlerContract_v1_4_1_Contract =
  CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
