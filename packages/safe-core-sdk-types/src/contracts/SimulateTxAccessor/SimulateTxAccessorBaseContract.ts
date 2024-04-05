import { Abi } from 'abitype'
import BaseContract from '../common/BaseContract'

/**
 * Represents the base contract type for a SimulateTxAccessor contract.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @type {SimulateTxAccessorBaseContract}
 */
type SimulateTxAccessorBaseContract<SimulateTxAccessorContractAbi extends Abi> =
  BaseContract<SimulateTxAccessorContractAbi>

export default SimulateTxAccessorBaseContract
