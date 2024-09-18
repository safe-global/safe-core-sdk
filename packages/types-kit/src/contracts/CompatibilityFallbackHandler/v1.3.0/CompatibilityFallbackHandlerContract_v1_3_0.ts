import { narrow } from 'abitype'
import compatibilityFallbackHandler_1_3_0_ContractArtifacts from '../../assets/CompatibilityFallbackHandler/v1.3.0/compatibility_fallback_handler'
import CompatibilityFallbackHandlerBaseContract from '../CompatibilityFallbackHandlerBaseContract'

const compatibilityFallbackHandlerContract_v1_3_0_AbiTypes = narrow(
  compatibilityFallbackHandler_1_3_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the CompatibilityFallbackHandler contract version 1.3.0.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_3_0_Abi}
 */
export type CompatibilityFallbackHandlerContract_v1_3_0_Abi =
  typeof compatibilityFallbackHandlerContract_v1_3_0_AbiTypes

/**
 * Represents the contract type for a CompatibilityFallbackHandler contract version 1.3.0 defining read and write methods.
 * Utilizes the generic CompatibilityFallbackHandlerBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_3_0_Contract}
 */
export type CompatibilityFallbackHandlerContract_v1_3_0_Contract =
  CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
