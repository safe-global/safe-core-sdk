import { Abi } from 'abitype'
import BaseContract from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

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
