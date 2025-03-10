import SafeProxyFactoryBaseContract from '@safe-global/protocol-kit/contracts/SafeProxyFactory/SafeProxyFactoryBaseContract'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  SafeProxyFactoryContract_v1_4_1_Abi,
  SafeProxyFactoryContract_v1_4_1_Contract,
  SafeProxyFactoryContract_v1_4_1_Function,
  safeProxyFactory_1_4_1_ContractArtifacts
} from '@safe-global/types-kit'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'

/**
 * SafeProxyFactoryContract_v1_4_1  is the implementation specific to the Safe Proxy Factory contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_4_1_Abi> - Inherits from SafeProxyFactoryBaseContract with ABI specific to Safe Proxy Factory contract version 1.4.1.
 * @implements SafeProxyFactoryContract_v1_4_1_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.4.1.
 */
class SafeProxyFactoryContract_v1_4_1
  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_4_1_Abi>
  implements SafeProxyFactoryContract_v1_4_1_Contract
{
  /**
   * Constructs an instance of SafeProxyFactoryContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_4_1_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = safeProxyFactory_1_4_1_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }

  /**
   * Returns the ID of the chain the contract is currently deployed on.
   * @returns Array[chainId]
   */
  getChainId: SafeProxyFactoryContract_v1_4_1_Function<'getChainId'> = async () => {
    return [await this.read('getChainId')]
  }

  /**
   * Allows to retrieve the creation code used for the Proxy deployment. With this it is easily possible to calculate predicted address.
   * @returns Array[creationCode]
   */
  proxyCreationCode: SafeProxyFactoryContract_v1_4_1_Function<'proxyCreationCode'> = async () => {
    return [await this.read('proxyCreationCode')]
  }

  /**
   * Deploys a new chain-specific proxy with singleton and salt. Optionally executes an initializer call to a new proxy.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxy]
   */
  createChainSpecificProxyWithNonce: SafeProxyFactoryContract_v1_4_1_Function<'createChainSpecificProxyWithNonce'> =
    async (args) => {
      return [await this.write('createChainSpecificProxyWithNonce', args)]
    }

  /**
   * Deploy a new proxy with singleton and salt.
   * Optionally executes an initializer call to a new proxy and calls a specified callback address.
   * @param args - Array[singleton, initializer, saltNonce, callback]
   * @returns Array[proxy]
   */
  createProxyWithCallback: SafeProxyFactoryContract_v1_4_1_Function<'createProxyWithCallback'> =
    async (args) => {
      return [await this.write('createProxyWithCallback', args)]
    }

  /**
   * Deploys a new proxy with singleton and salt. Optionally executes an initializer call to a new proxy.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxy]
   */
  createProxyWithNonce: SafeProxyFactoryContract_v1_4_1_Function<'createProxyWithNonce'> = async (
    args
  ) => {
    return [await this.write('createProxyWithNonce', args)]
  }
}

export default SafeProxyFactoryContract_v1_4_1
