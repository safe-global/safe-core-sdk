import { TransactionReceipt } from 'web3-core/types'
import SafeProxyFactoryBaseContractWeb3, {
  CreateProxyProps
} from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/SafeProxyFactoryBaseContractWeb3'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safeProxyFactory_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.3.0/proxy_factory'
import SafeProxyFactoryContract_v1_3_0_Contract, {
  SafeProxyFactoryContract_v1_3_0_Abi as SafeProxyFactoryContract_v1_3_0_Abi_Readonly,
  SafeProxyFactoryContract_v1_3_0_Function
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

// Remove all nested `readonly` modifiers from the ABI type
type SafeProxyFactoryContract_v1_3_0_Abi =
  DeepWriteable<SafeProxyFactoryContract_v1_3_0_Abi_Readonly>

/**
 * SafeProxyFactoryContract_v1_3_0_Web3 is the implementation specific to the Safe Proxy Factory contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.3.0 using Web3.js.
 *
 * @extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi> - Inherits from SafeProxyFactoryBaseContractWeb3 with ABI specific to Safe Proxy Factory contract version 1.3.0.
 * @implements SafeProxyFactoryContract_v1_3_0_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.3.0.
 */
class SafeProxyFactoryContract_v1_3_0_Web3
  extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi>
  implements SafeProxyFactoryContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactoryContract_v1_3_0_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi =
      safeProxyFactory_1_3_0_ContractArtifacts.abi as SafeProxyFactoryContract_v1_3_0_Abi

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as SafeProxyFactoryContract_v1_3_0_Abi
    )

    this.safeVersion = safeVersion
  }

  /**
   * Allows to retrieve the creation code used for the Proxy deployment. With this it is easily possible to calculate predicted address.
   * @returns Array[creationCode]
   */
  proxyCreationCode: SafeProxyFactoryContract_v1_3_0_Function<'proxyCreationCode'> = async () => {
    return [await this.contract.methods.proxyCreationCode().call()]
  }

  /**
   * Allows to retrieve the runtime code of a deployed Proxy. This can be used to check that the expected Proxy was deployed.
   * @returns Array[runtimeCode]
   */
  proxyRuntimeCode: SafeProxyFactoryContract_v1_3_0_Function<'proxyRuntimeCode'> = async () => {
    return [await this.contract.methods.proxyRuntimeCode().call()]
  }

  /**
   * Allows to get the address for a new proxy contact created via `createProxyWithNonce`.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxyAddress]
   */
  calculateCreateProxyWithNonceAddress: SafeProxyFactoryContract_v1_3_0_Function<'calculateCreateProxyWithNonceAddress'> =
    async (args) => {
      return [await this.contract.methods.calculateCreateProxyWithNonceAddress(...args).call()]
    }

  /**
   * Allows to create new proxy contact and execute a message call to the new proxy within one transaction.
   * @param args - Array[singleton, data]
   * @returns Array[proxyAddress]
   */
  createProxy: SafeProxyFactoryContract_v1_3_0_Function<'createProxy'> = async (args) => {
    return [await this.contract.methods.createProxy(...args).call()]
  }

  /**
   * Allows to create new proxy contract, execute a message call to the new proxy and call a specified callback within one transaction.
   * @param args - Array[singleton, initializer, saltNonce, callback]
   * @returns Array[proxyAddress]
   */
  createProxyWithCallback: SafeProxyFactoryContract_v1_3_0_Function<'createProxyWithCallback'> =
    async (args) => {
      return [await this.contract.methods.createProxyWithCallback(...args).call()]
    }

  /**
   * Allows to create new proxy contract and execute a message call to the new proxy within one transaction.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxyAddress]
   */
  createProxyWithNonce: SafeProxyFactoryContract_v1_3_0_Function<'createProxyWithNonce'> = async (
    args
  ) => {
    return [await this.contract.methods.createProxyWithNonce(...args).call()]
  }

  /**
   * Allows to create new proxy contract and execute a message call to the new proxy within one transaction.
   * @param {CreateProxyProps} props - Properties for the new proxy contract.
   * @returns The address of the new proxy contract.
   */
  async createProxyWithOptions({
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
          {
            ...options
          }
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

      createProxy: this.createProxyWithOptions.bind(this),

      getAddress: this.getAddress.bind(this),

      proxyCreationCode: async () => (await this.proxyCreationCode())[0]
    }
  }
}

export default SafeProxyFactoryContract_v1_3_0_Web3
