import { ExtractAbiFunctionNames, narrow } from 'abitype'
import compatibilityFallbackHandler_1_5_0_ContractArtifacts from '../../assets/CompatibilityFallbackHandler/v1.5.0/compatibility_fallback_handler'
import CompatibilityFallbackHandlerBaseContract from '../CompatibilityFallbackHandlerBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const compatibilityFallbackHandlerContract_v1_5_0_AbiTypes = narrow(
  compatibilityFallbackHandler_1_5_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the CompatibilityFallbackHandler contract version 1.5.0.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_5_0_Abi}
 */
export type CompatibilityFallbackHandlerContract_v1_5_0_Abi =
  typeof compatibilityFallbackHandlerContract_v1_5_0_AbiTypes

/**
 * Represents the function type derived by the given function name from the CompatibilityFallbackHandler contract version 1.5.0 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {CompatibilityFallbackHandlerContract_v1_5_0_Function}
 */
export type CompatibilityFallbackHandlerContract_v1_5_0_Function<
  ContractFunctionName extends
    ExtractAbiFunctionNames<CompatibilityFallbackHandlerContract_v1_5_0_Abi>
> = ContractFunction<CompatibilityFallbackHandlerContract_v1_5_0_Abi, ContractFunctionName>

/**
 * Represents the contract type for a CompatibilityFallbackHandler contract version 1.5.0 defining read and write methods.
 * Utilizes the generic CompatibilityFallbackHandlerBaseContract with the ABI specific to version 1.5.0.
 *
 * @type {CompatibilityFallbackHandlerContract_v1_5_0_Contract}
 */
export type CompatibilityFallbackHandlerContract_v1_5_0_Contract =
  CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_5_0_Abi> & {
    /**
     * New in v1.5.0: encodeTransactionData was moved from the Safe contract to CompatibilityFallbackHandler
     * to preserve backwards compatibility for existing integrations.
     * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce]
     * @returns Array[encodedData]
     */
    encodeTransactionData: CompatibilityFallbackHandlerContract_v1_5_0_Function<'encodeTransactionData'>
  }
