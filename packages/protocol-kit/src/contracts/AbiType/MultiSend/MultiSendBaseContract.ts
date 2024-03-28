import { Abi } from 'abitype'
import BaseContract from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

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
