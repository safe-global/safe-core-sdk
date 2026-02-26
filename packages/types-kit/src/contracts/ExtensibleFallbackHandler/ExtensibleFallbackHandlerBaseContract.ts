import { Abi } from 'abitype'
import BaseContract from '../common/BaseContract'

/**
 * Represents the base contract type for an ExtensibleFallbackHandler contract.
 *
 * @template ExtensibleFallbackHandlerContractAbi - The ABI of the ExtensibleFallbackHandler contract.
 * @type {ExtensibleFallbackHandlerBaseContract}
 */
type ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContractAbi extends Abi> =
  BaseContract<ExtensibleFallbackHandlerContractAbi, never>

export default ExtensibleFallbackHandlerBaseContract
