import { Abi } from 'abitype'
import BaseContract, {
  SafeContractFunction,
  ContractReadFunctionNames,
  EstimateGasFunction
} from '../common/BaseContract'

/**
 * Represents the base contract type for a CreateCall contract.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @type {CreateCallBaseContract}
 */
export type CreateCallBaseContract<CreateCallContractAbi extends Abi> = BaseContract<
  CreateCallContractAbi,
  ContractReadFunctionNames<CreateCallContractAbi>
> & {
  estimateGas: EstimateGasFunction<CreateCallContractAbi>
  performCreate: SafeContractFunction<CreateCallContractAbi, 'performCreate'>
  performCreate2: SafeContractFunction<CreateCallContractAbi, 'performCreate2'>
}

export default CreateCallBaseContract
