import { narrow } from 'abitype'
import extensibleFallbackHandler_1_5_0_ContractArtifacts from '../../assets/ExtensibleFallbackHandler/v1.5.0/extensible_fallback_handler'
import ExtensibleFallbackHandlerBaseContract from '../ExtensibleFallbackHandlerBaseContract'

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
 * Represents the contract type for an ExtensibleFallbackHandler contract version 1.5.0 defining read and write methods.
 * Utilizes the generic ExtensibleFallbackHandlerBaseContract with the ABI specific to version 1.5.0.
 *
 * @type {ExtensibleFallbackHandlerContract_v1_5_0_Contract}
 */
export type ExtensibleFallbackHandlerContract_v1_5_0_Contract =
  ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
