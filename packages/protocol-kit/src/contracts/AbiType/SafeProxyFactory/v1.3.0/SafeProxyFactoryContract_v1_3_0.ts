import { narrow } from 'abitype'
import safeProxyFactory_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.3.0/proxy_factory'
import SafeProxyFactoryBaseContract from '../SafeProxyFactoryBaseContract'

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
 * Represents the contract type for a Safe Proxy Factory contract version 1.3.0, defining read and write methods.
 * Utilizes the generic SafeProxyFactoryBaseContract with the ABI specific to version 1.3.0.
 *
 * @type {SafeProxyFactoryContract_v1_3_0_Contract}
 */
type SafeProxyFactoryContract_v1_3_0_Contract =
  SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>

export default SafeProxyFactoryContract_v1_3_0_Contract
