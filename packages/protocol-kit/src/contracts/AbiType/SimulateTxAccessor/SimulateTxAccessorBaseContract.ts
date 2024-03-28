import { Abi } from 'abitype'
import BaseContract from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * Represents the base contract type for a SimulateTxAccessor contract.
 *
 * @template SimulateTxAccessorContractAbi - The ABI of the SimulateTxAccessor contract.
 * @type {SimulateTxAccessorBaseContract}
 */
type SimulateTxAccessorBaseContract<SimulateTxAccessorContractAbi extends Abi> =
  BaseContract<SimulateTxAccessorContractAbi>

export default SimulateTxAccessorBaseContract
