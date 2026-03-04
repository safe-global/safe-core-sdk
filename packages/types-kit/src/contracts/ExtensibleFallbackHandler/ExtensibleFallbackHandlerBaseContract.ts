import { Abi } from 'abitype'
import BaseContract, {
  ContractReadFunctionNames,
  EstimateGasFunction,
  SafeContractFunction
} from '../common/BaseContract'

/**
 * Represents the base contract type for an ExtensibleFallbackHandler contract.
 *
 * @template ExtensibleFallbackHandlerContractAbi - The ABI of the ExtensibleFallbackHandler contract.
 * @type {ExtensibleFallbackHandlerBaseContract}
 */
type ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContractAbi extends Abi> =
  BaseContract<
    ExtensibleFallbackHandlerContractAbi,
    ContractReadFunctionNames<ExtensibleFallbackHandlerContractAbi>
  > & {
    estimateGas: EstimateGasFunction<ExtensibleFallbackHandlerContractAbi>
    addSupportedInterfaceBatch: SafeContractFunction<
      ExtensibleFallbackHandlerContractAbi,
      'addSupportedInterfaceBatch'
    >
    removeSupportedInterfaceBatch: SafeContractFunction<
      ExtensibleFallbackHandlerContractAbi,
      'removeSupportedInterfaceBatch'
    >
    setDomainVerifier: SafeContractFunction<
      ExtensibleFallbackHandlerContractAbi,
      'setDomainVerifier'
    >
    setSafeMethod: SafeContractFunction<ExtensibleFallbackHandlerContractAbi, 'setSafeMethod'>
    setSupportedInterface: SafeContractFunction<
      ExtensibleFallbackHandlerContractAbi,
      'setSupportedInterface'
    >
  }

export default ExtensibleFallbackHandlerBaseContract
