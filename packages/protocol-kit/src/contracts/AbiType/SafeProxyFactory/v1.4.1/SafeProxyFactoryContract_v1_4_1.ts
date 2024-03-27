import { narrow } from 'abitype'
import safeProxyFactory_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.4.1/safe_proxy_factory'
import SafeProxyFactoryBaseContract from '../SafeProxyFactoryBaseContract'

const safeProxyFactoryContract_v1_4_1_AbiTypes = narrow(
  safeProxyFactory_1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the Safe Proxy Factory contract version 1.4.1.
 *
 * @type {SafeProxyFactoryContract_v1_4_1_Abi}
 */
export type SafeProxyFactoryContract_v1_4_1_Abi = typeof safeProxyFactoryContract_v1_4_1_AbiTypes

/**
 * Represents the contract type for a Safe Proxy Factory contract version 1.4.1, defining read and write methods.
 * Utilizes the generic SafeProxyFactoryBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SafeProxyFactoryContract_v1_4_1_Contract}
 */
type SafeProxyFactoryContract_v1_4_1_Contract =
  SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_4_1_Abi>

export default SafeProxyFactoryContract_v1_4_1_Contract
