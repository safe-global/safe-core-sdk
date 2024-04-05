import { narrow } from 'abitype'
import simulateTxAccessor_1_4_1_ContractArtifacts from '../../assets/SimulateTxAccessor/v1.4.1/simulate_tx_accessor'
import SimulateTxAccessorBaseContract from '../SimulateTxAccessorBaseContract'

const simulateTxAccessorContract_v1_4_1_AbiTypes = narrow(
  simulateTxAccessor_1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the SimulateTxAccessor contract version 1.4.1.
 *
 * @type {SimulateTxAccessorContract_v1_4_1_Abi}
 */
export type SimulateTxAccessorContract_v1_4_1_Abi =
  typeof simulateTxAccessorContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a SimulateTxAccessor contract version 1.4.1 defining read and write methods.
 * Utilizes the generic SimulateTxAccessorBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SimulateTxAccessorContract_v1_4_1_Contract}
 */
export type SimulateTxAccessorContract_v1_4_1_Contract =
  SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_4_1_Abi>
