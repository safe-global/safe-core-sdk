import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import {
  EthersAdapter,
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers'
import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3'
import BaseContract, {
  ContractReadFunctionNames,
  EstimateGasFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import { EthAdapter } from 'packages/safe-core-sdk-types'

/**
 * Defines a function type for the CreateCall contract, derived by the given function name from a given contract ABI.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @template Adapter - The EthAdapter type to use.
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @template TransactionOptions - The transaction options object depending on the Adapter.
 * @template TransactionResult - The transaction result object depending on the Adapter.
 */
export type CreateCallContractFunction<
  CreateCallContractAbi extends Abi, // Abi of the CreateCall Contract,
  Adapter extends EthAdapter,
  ContractFunctionName extends
    ExtractAbiFunctionNames<CreateCallContractAbi> = ExtractAbiFunctionNames<CreateCallContractAbi>,
  TransactionOptions = Adapter extends EthersAdapter
    ? EthersTransactionOptions
    : Web3TransactionOptions,
  TransactionResult = Adapter extends EthersAdapter
    ? EthersTransactionResult
    : Web3TransactionResult
> = (
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<CreateCallContractAbi, ContractFunctionName>['inputs']
  >,
  options?: TransactionOptions
) => Promise<TransactionResult>

export type CreateCallBaseContract<
  CreateCallContractAbi extends Abi,
  Adapter extends EthAdapter
> = BaseContract<CreateCallContractAbi, ContractReadFunctionNames<CreateCallContractAbi>> & {
  estimateGas: EstimateGasFunction<CreateCallContractAbi>
  performCreate: CreateCallContractFunction<CreateCallContractAbi, Adapter, 'performCreate'>
  performCreate2: CreateCallContractFunction<CreateCallContractAbi, Adapter, 'performCreate2'>
}

export default CreateCallBaseContract
