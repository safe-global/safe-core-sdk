import { Abi } from 'abitype'
import BaseContract, {
  AdapterSpecificContractFunction,
  ContractReadFunctionNames,
  EstimateGasFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'

/**
 * Represents the base contract type for a SignMessageLib contract.
 *
 * @template SignMessageLibContractAbi - The ABI of the SignMessageLib contract.
 * @template Adapter - The EthAdapter type to use.
 * @type {SignMessageLibBaseContract}
 */
type SignMessageLibBaseContract<
  SignMessageLibContractAbi extends Abi,
  Adapter extends EthAdapter
> = BaseContract<
  SignMessageLibContractAbi,
  ContractReadFunctionNames<SignMessageLibContractAbi>
> & {
  estimateGas: EstimateGasFunction<SignMessageLibContractAbi>
  signMessage: AdapterSpecificContractFunction<SignMessageLibContractAbi, Adapter, 'signMessage'>
}

export default SignMessageLibBaseContract
