import { Abi } from 'abitype'
import BaseContract from '../common/BaseContract'

/**
 * Represents the base contract type for a MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbi - The ABI of the MultiSendCallOnly contract.
 * @type {MultiSendCallOnlyBaseContract}
 */
type MultiSendCallOnlyBaseContract<MultiSendCallOnlyContractAbi extends Abi> = BaseContract<
  MultiSendCallOnlyContractAbi,
  never
>

export default MultiSendCallOnlyBaseContract
