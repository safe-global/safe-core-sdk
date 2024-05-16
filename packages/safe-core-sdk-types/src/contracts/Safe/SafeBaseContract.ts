import { Abi } from 'abitype'
import BaseContract, {
  ContractReadFunctionNames,
  EstimateGasFunction
} from '../common/BaseContract'

/**
 * Represents the base contract type for a Safe contract, defining read methods and utility functions like encode and estimateGas.
 *
 * @template SafeContractAbi - The ABI of the Safe contract.
 * @type {SafeBaseContract}
 */
type SafeBaseContract<SafeContractAbi extends Abi> = BaseContract<
  SafeContractAbi,
  ContractReadFunctionNames<SafeContractAbi>
> & {
  estimateGas: EstimateGasFunction<SafeContractAbi>
}

export default SafeBaseContract
