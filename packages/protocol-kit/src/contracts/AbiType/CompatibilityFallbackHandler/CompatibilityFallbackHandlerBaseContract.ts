import { Abi } from 'abitype'
import BaseContract from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * Represents the base contract type for a CompatibilityFallbackHandler contract.
 *
 * @template CompatibilityFallbackHandlerContractAbi - The ABI of the CompatibilityFallbackHandler contract.
 * @type {CompatibilityFallbackHandlerBaseContract}
 */
type CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContractAbi extends Abi> =
  BaseContract<CompatibilityFallbackHandlerContractAbi, never>

export default CompatibilityFallbackHandlerBaseContract
