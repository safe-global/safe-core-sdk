import { Abi } from 'abitype'
import BaseContract, {
  AdapterSpecificContractFunction,
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
  performCreate: AdapterSpecificContractFunction<CreateCallContractAbi, 'performCreate'>
  performCreate2: AdapterSpecificContractFunction<CreateCallContractAbi, 'performCreate2'>
}

export default CreateCallBaseContract
