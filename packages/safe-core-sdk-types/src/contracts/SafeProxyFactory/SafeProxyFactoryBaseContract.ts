import { Abi } from 'abitype'
import BaseContract, { EstimateGasFunction } from '../common/BaseContract'

/**
 * Represents the base contract type for a Safe Proxy Factory contract.
 *
 * @template SafeProxyFactoryContractAbi - The ABI of the Safe Proxy factory contract.
 * @type {SafeProxyFactoryBaseContract}
 */
export type SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbi extends Abi> =
  BaseContract<SafeProxyFactoryContractAbi> & {
    estimateGas: EstimateGasFunction<SafeProxyFactoryContractAbi>
  }

export default SafeProxyFactoryBaseContract
