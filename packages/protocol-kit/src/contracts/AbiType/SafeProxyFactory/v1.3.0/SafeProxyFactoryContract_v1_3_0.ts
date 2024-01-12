import { narrow } from 'abitype'
import safeProxyFactory_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.3.0/proxy_factory'
import SafeBaseProxyFactoryContract, {
  ProxyFactoryContractReadFunctions,
  ProxyFactoryContractWriteFunctions
} from '../safeProxyFactoryContract'

const safeProxyFactoryContract_v1_3_0_AbiTypes = narrow(
  safeProxyFactory_1_3_0_ContractArtifacts.abi
)

/**
 * Represents the ABI of the Safe Proxy Factory contract version 1.3.0.
 *
 * @type {SafeProxyFactoryContract_v1_3_0_Abi}
 */
export type SafeProxyFactoryContract_v1_3_0_Abi = typeof safeProxyFactoryContract_v1_3_0_AbiTypes

/**
 * Extracts the names of read-only functions (view or pure) specific to the Safe Proxy Factory contract version 1.3.0.
 *
 * @type {ProxyFactory_v1_3_0_Read_Functions}
 */
export type ProxyFactory_v1_3_0_Read_Functions =
  ProxyFactoryContractReadFunctions<SafeProxyFactoryContract_v1_3_0_Abi>

/**
 * Extracts the names of write functions (nonpayable or payable) specific to the Safe Proxy Factory contract version 1.3.0.
 *
 * @type {SafeProxyFactory_v1_3_0_Write_Functions}
 */
export type SafeProxyFactory_v1_3_0_Write_Functions =
  ProxyFactoryContractWriteFunctions<SafeProxyFactoryContract_v1_3_0_Abi>

/**
 * Represents the contract type for a Safe Proxy Factory contract version 1.3.0, defining read and write methods.
 * Utilizes the generic SafeBaseProxyFactoryContract with the ABI specific to version 1.3.0.
 *
 * @type {SafeProxyFactoryContract_v1_3_0_Contract}
 */
type SafeProxyFactoryContract_v1_3_0_Contract =
  SafeBaseProxyFactoryContract<SafeProxyFactoryContract_v1_3_0_Abi>

export default SafeProxyFactoryContract_v1_3_0_Contract
