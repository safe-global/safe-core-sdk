import { ExtractAbiFunctionNames, narrow } from 'abitype'
import simulateTxAccessor_1_3_0_ContractArtifacts from '../../assets/SimulateTxAccessor/v1.3.0/simulate_tx_accessor'
import SimulateTxAccessorBaseContract from '../SimulateTxAccessorBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const simulateTxAccessorContract_v1_3_0_AbiTypes = narrow(
  simulateTxAccessor_1_3_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the SimulateTxAccessor contract version 1.3.0.
 *
 * @type {SimulateTxAccessorContract_v1_3_0_Abi}
 */
export type SimulateTxAccessorContract_v1_3_0_Abi =
  typeof simulateTxAccessorContract_v1_3_0_AbiTypes

/**
 * Represents the function type derived by the given function name from the SimulateTxAccessor contract version 1.3.0 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SimulateTxAccessorContract_v1_3_0_Function}
 */
export type SimulateTxAccessorContract_v1_3_0_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SimulateTxAccessorContract_v1_3_0_Abi>
> = ContractFunction<SimulateTxAccessorContract_v1_3_0_Abi, ContractFunctionName>

/**
 * Represents the contract type for a SimulateTxAccessor contract version 1.3.0 defining read and write methods.
 * Utilizes the generic SimulateTxAccessorBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {SimulateTxAccessorContract_v1_3_0_Contract}
 */
export type SimulateTxAccessorContract_v1_3_0_Contract =
  SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
