import { ExtractAbiFunctionNames, narrow } from 'abitype'
import safeProxyFactory_1_1_1_ContractArtifacts from '../../assets/SafeProxyFactory/v1.1.1/proxy_factory'
import SafeProxyFactoryBaseContract from '../SafeProxyFactoryBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const safeProxyFactoryContract_v1_1_1_AbiTypes = narrow(
  safeProxyFactory_1_1_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the Safe Proxy Factory contract version 1.1.1.
 *
 * @type {SafeProxyFactoryContract_v1_1_1_Abi}
 */
export type SafeProxyFactoryContract_v1_1_1_Abi = typeof safeProxyFactoryContract_v1_1_1_AbiTypes

/**
 * Represents the function type derived by the given function name from the SafeProxyFactory contract version 1.1.1 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SafeProxyFactoryContract_v1_1_1_Function}
 */
export type SafeProxyFactoryContract_v1_1_1_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SafeProxyFactoryContract_v1_1_1_Abi>
> = ContractFunction<SafeProxyFactoryContract_v1_1_1_Abi, ContractFunctionName>

/**
 * Represents the contract type for a Safe Proxy Factory contract version 1.1.1, defining read and write methods.
 * Utilizes the generic SafeProxyFactoryBaseContract with the ABI specific to version 1.1.1.
 *
 * @type {SafeProxyFactoryContract_v1_1_1_Contract}
 */
export type SafeProxyFactoryContract_v1_1_1_Contract =
  SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_1_1_Abi>
