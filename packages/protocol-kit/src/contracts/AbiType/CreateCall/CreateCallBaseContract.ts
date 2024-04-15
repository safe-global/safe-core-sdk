import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from 'abitype'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers'
/**
 * Encodes a function call for a CreateCall contract.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @template CreateCallFunction - The function to encode, derived from the ABI.
 */
export type EncodeCreateCallFunction<
  CreateCallContractAbi extends Abi, // Abi of the CreateCall Contract,
  CreateCallFunction extends
    ExtractAbiFunctionNames<CreateCallContractAbi> = ExtractAbiFunctionNames<CreateCallContractAbi>
> = (
  functionToEncode: CreateCallFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<CreateCallContractAbi, CreateCallFunction>['inputs'],
    'inputs'
  >
) => string

export type GetAddressCreateCallFunction = () => Promise<string>

/**
 * Estimates the gas required for a function call on a CreateCall contract.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @template CreateCallFunction - The function for which gas is being estimated, derived from the ABI.
 */
export type EstimateGasCreateCallFunction<
  CreateCallContractAbi extends Abi, // Abi of the CreateCall Contract,
  TransactionOptions extends EthersTransactionOptions,
  CreateCallFunction extends
    ExtractAbiFunctionNames<CreateCallContractAbi> = ExtractAbiFunctionNames<CreateCallContractAbi>
> = (
  functionToEncode: CreateCallFunction,
  params: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<CreateCallContractAbi, CreateCallFunction>['inputs'],
    'inputs'
  >,
  options?: TransactionOptions
) => Promise<bigint>

/**
 * Extracts the names of read-only functions (view or pure) from a given CreateCall contract ABI.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 * @type {CreateCallContractReadFunctions}
 */
export type CreateCallContractReadFunctions<CreateCallContractAbi extends Abi> =
  ExtractAbiFunctionNames<CreateCallContractAbi, 'view' | 'pure'>

/**
 * Deploys a new contract using the create opcode.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 */
export type PerformCreateFunction<
  CreateCallContractAbi extends Abi, // Abi of the CreateCall Contract,
  TransactionOptions extends EthersTransactionOptions
> = (
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<CreateCallContractAbi, 'performCreate'>['inputs']
  >,
  options?: TransactionOptions
) => Promise<EthersTransactionResult>

/**
 * Deploys a new contract using the create2 opcode.
 *
 * @template CreateCallContractAbi - The ABI of the CreateCall contract.
 */
export type PerformCreate2Function<
  CreateCallContractAbi extends Abi, // Abi of the CreateCall Contract,
  TransactionOptions extends EthersTransactionOptions
> = (
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<CreateCallContractAbi, 'performCreate2'>['inputs']
  >,
  options?: TransactionOptions
) => Promise<EthersTransactionResult>

type CreateCallBaseContract<CreateCallContractAbi extends Abi> = {
  [ProxyFactoryFunction in CreateCallContractReadFunctions<CreateCallContractAbi>]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<CreateCallContractAbi, ProxyFactoryFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<CreateCallContractAbi, ProxyFactoryFunction>['outputs'],
      'outputs'
    >
  >
} & {
  safeVersion: SafeVersion
  encode: EncodeCreateCallFunction<CreateCallContractAbi>
  getAddress: GetAddressCreateCallFunction
  estimateGas: EstimateGasCreateCallFunction<CreateCallContractAbi, EthersTransactionOptions>
  performCreate: PerformCreateFunction<CreateCallContractAbi, EthersTransactionOptions>
  performCreate2: PerformCreate2Function<CreateCallContractAbi, EthersTransactionOptions>
}

export default CreateCallBaseContract
