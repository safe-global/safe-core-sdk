import { TransactionReceipt } from 'web3-core/types'
import SafeProxyFactoryBaseContractWeb3, {
  CreateProxyProps
} from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/SafeProxyFactoryBaseContractWeb3'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safeProxyFactory_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.4.1/safe_proxy_factory'
import SafeProxyFactoryContract_v1_4_1_Contract, {
  SafeProxyFactoryContract_v1_4_1_Abi as SafeProxyFactoryContract_v1_4_1_Abi_Readonly,
  SafeProxyFactoryContract_v1_4_1_Function
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

// Remove all nested `readonly` modifiers from the ABI type
type SafeProxyFactoryContract_v1_4_1_Abi =
  DeepWriteable<SafeProxyFactoryContract_v1_4_1_Abi_Readonly>

/**
 * SafeProxyFactoryContract_v1_4_1_Web3 is the implementation specific to the Safe Proxy Factory contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.4.1 using Web3.js.
 *
 * @extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_4_1_Abi> - Inherits from SafeProxyFactoryBaseContractWeb3 with ABI specific to Safe Proxy Factory contract version 1.4.1.
 * @implements SafeProxyFactoryContract_v1_4_1_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.4.1.
 */
class SafeProxyFactoryContract_v1_4_1_Web3
  extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_4_1_Abi>
  implements SafeProxyFactoryContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactoryContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi =
      safeProxyFactory_1_4_1_ContractArtifacts.abi as SafeProxyFactoryContract_v1_4_1_Abi

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as SafeProxyFactoryContract_v1_4_1_Abi
    )

    this.safeVersion = safeVersion
  }

  /**
   * Returns the ID of the chain the contract is currently deployed on.
   * @returns Array[chainId]
   */
  getChainId: SafeProxyFactoryContract_v1_4_1_Function<'getChainId'> = async () => {
    return [await this.contract.methods.getChainId().call()]
  }

  /**
   * Allows to retrieve the creation code used for the Proxy deployment. With this it is easily possible to calculate predicted address.
   * @returns Array[creationCode]
   */
  proxyCreationCode: SafeProxyFactoryContract_v1_4_1_Function<'proxyCreationCode'> = async () => {
    return [await this.contract.methods.proxyCreationCode().call()]
  }

  /**
   * Deploys a new chain-specific proxy with singleton and salt. Optionally executes an initializer call to a new proxy.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxy]
   */
  createChainSpecificProxyWithNonce: SafeProxyFactoryContract_v1_4_1_Function<'createChainSpecificProxyWithNonce'> =
    async (args) => {
      return [await this.contract.methods.createChainSpecificProxyWithNonce(...args).call()]
    }

  /**
   * Deploy a new proxy with singleton and salt.
   * Optionally executes an initializer call to a new proxy and calls a specified callback address.
   * @param args - Array[singleton, initializer, saltNonce, callback]
   * @returns Array[proxy]
   */
  createProxyWithCallback: SafeProxyFactoryContract_v1_4_1_Function<'createProxyWithCallback'> =
    async (args) => {
      return [await this.contract.methods.createProxyWithCallback(...args).call()]
    }

  /**
   * Deploys a new proxy with singleton and salt. Optionally executes an initializer call to a new proxy.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxy]
   */
  createProxyWithNonce: SafeProxyFactoryContract_v1_4_1_Function<'createProxyWithNonce'> = async (
    args
  ) => {
    return [await this.contract.methods.createProxyWithNonce(...args).call()]
  }

  /**
   * Allows to create new proxy contract and execute a message call to the new proxy within one transaction.
   * @param {CreateProxyProps} props - Properties for the new proxy contract.
   * @returns The address of the new proxy contract.
   */
  async createProxy({
    safeSingletonAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: CreateProxyProps): Promise<string> {
    const saltNonceBigInt = BigInt(saltNonce)

    if (saltNonceBigInt < 0) throw new Error('saltNonce must be greater than or equal to 0')
    if (options && !options.gas) {
      options.gas = (
        await this.estimateGas(
          'createProxyWithNonce',
          [safeSingletonAddress, initializer, saltNonceBigInt],
          { ...options }
        )
      ).toString()
    }

    const txResponse = this.contract.methods
      .createProxyWithNonce(safeSingletonAddress, initializer, saltNonce)
      .send(options)

    if (callback) {
      const txResult = await toTxResult(txResponse)
      callback(txResult.hash)
    }

    const txResult: TransactionReceipt = await new Promise((resolve, reject) =>
      txResponse.once('receipt', (receipt: TransactionReceipt) => resolve(receipt)).catch(reject)
    )
    const proxyAddress = txResult.events?.ProxyCreation?.returnValues?.proxy
    if (!proxyAddress) {
      throw new Error('SafeProxy was not deployed correctly')
    }
    return proxyAddress
  }

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract,

      encode: this.encode.bind(this),

      estimateGas: async (...args: Parameters<typeof this.estimateGas>) =>
        (await this.estimateGas(...args)).toString(),

      createProxy: this.createProxy.bind(this),

      getAddress: this.getAddress.bind(this),

      proxyCreationCode: async () => (await this.proxyCreationCode())[0]
    }
  }
}

export default SafeProxyFactoryContract_v1_4_1_Web3
