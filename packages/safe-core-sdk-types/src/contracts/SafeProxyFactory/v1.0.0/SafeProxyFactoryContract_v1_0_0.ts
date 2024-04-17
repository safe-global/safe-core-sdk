import { ExtractAbiFunctionNames, narrow } from 'abitype'
import safeProxyFactory_1_0_0_ContractArtifacts from '../../assets/SafeProxyFactory/v1.0.0/proxy_factory'
import SafeProxyFactoryBaseContract from '../SafeProxyFactoryBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const safeProxyFactoryContract_v1_0_0_AbiTypes = narrow(
  safeProxyFactory_1_0_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the Safe Proxy Factory contract version 1.0.0.
 *
 * @type {SafeProxyFactoryContract_v1_0_0_Abi}
 */
export type SafeProxyFactoryContract_v1_0_0_Abi = typeof safeProxyFactoryContract_v1_0_0_AbiTypes

/**
 * Represents the function type derived by the given function name from the SafeProxyFactory contract version 1.0.0 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SafeProxyFactoryContract_v1_0_0_Function}
 */
export type SafeProxyFactoryContract_v1_0_0_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SafeProxyFactoryContract_v1_0_0_Abi>
> = ContractFunction<SafeProxyFactoryContract_v1_0_0_Abi, ContractFunctionName>

/**
 * Represents the contract type for a Safe Proxy Factory contract version 1.0.0, defining read and write methods.
 * Utilizes the generic SafeProxyFactoryBaseContract with the ABI specific to version 1.0.0.
 *
 * @type {SafeProxyFactoryContract_v1_0_0_Contract}
 */
export type SafeProxyFactoryContract_v1_0_0_Contract =
  SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_0_0_Abi>
