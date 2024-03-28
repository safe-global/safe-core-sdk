import { Abi } from 'abitype'
import BaseContract, {
  AdapterSepcificContractFunction,
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
  performCreate: AdapterSepcificContractFunction<CreateCallContractAbi, Adapter, 'performCreate'>
  performCreate2: AdapterSepcificContractFunction<CreateCallContractAbi, Adapter, 'performCreate2'>
}

export default CreateCallBaseContract
