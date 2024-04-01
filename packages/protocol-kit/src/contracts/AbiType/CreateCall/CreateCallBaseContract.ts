import { Abi } from 'abitype'
import BaseContract, {
  AdapterSpecificContractFunction,
  ContractReadFunctionNames,
  EstimateGasFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'

/**
 * Represents the base contract type for a CreateCall contract.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @template Adapter - The EthAdapter type to use.
 * @type {CreateCallBaseContract}
 */
export type CreateCallBaseContract<
  CreateCallContractAbi extends Abi,
  Adapter extends EthAdapter
> = BaseContract<CreateCallContractAbi, ContractReadFunctionNames<CreateCallContractAbi>> & {
  estimateGas: EstimateGasFunction<CreateCallContractAbi>
  performCreate: AdapterSpecificContractFunction<CreateCallContractAbi, Adapter, 'performCreate'>
  performCreate2: AdapterSpecificContractFunction<CreateCallContractAbi, Adapter, 'performCreate2'>
}

export default CreateCallBaseContract
