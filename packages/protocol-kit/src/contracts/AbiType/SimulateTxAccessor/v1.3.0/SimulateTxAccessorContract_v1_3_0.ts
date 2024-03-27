import { narrow } from 'abitype'
import simulateTxAccessor_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SimulateTxAccessor/v1.3.0/simulate_tx_accessor'
import SimulateTxAccessorBaseContract from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/SimulateTxAccessorBaseContract'

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
 * Represents the contract type for a SimulateTxAccessor contract version 1.3.0 defining read and write methods.
 * Utilizes the generic SimulateTxAccessorBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {SimulateTxAccessorContract_v1_3_0_Contract}
 */
type SimulateTxAccessorContract_v1_3_0_Contract =
  SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>

export default SimulateTxAccessorContract_v1_3_0_Contract
