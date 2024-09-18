import { Abi } from 'abitype'
import BaseContract from '../common/BaseContract'

/**
 * Represents the base contract type for a MultiSend contract.
 *
 * @template MultiSendContractAbi - The ABI of the MultiSend contract.
 * @type {MultiSendBaseContract}
 */
type MultiSendBaseContract<MultiSendContractAbi extends Abi> = BaseContract<
  MultiSendContractAbi,
  never
>

export default MultiSendBaseContract
