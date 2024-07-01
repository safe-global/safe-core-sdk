import { EventLog } from 'ethers'
import { PublicClient } from 'viem'
import SafeProxyFactoryBaseContract, {
  CreateProxyProps
} from '@safe-global/protocol-kit/contracts/SafeProxyFactory/SafeProxyFactoryBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  SafeVersion,
  SafeProxyFactoryContract_v1_3_0_Abi,
  SafeProxyFactoryContract_v1_3_0_Contract,
  SafeProxyFactoryContract_v1_3_0_Function,
  safeProxyFactory_1_3_0_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'

/**
 * SafeProxyFactoryContract_v1_3_0  is the implementation specific to the Safe Proxy Factory contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.3.0 using Ethers.js v6.
 *
 * @extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi> - Inherits from SafeProxyFactoryBaseContract with ABI specific to Safe Proxy Factory contract version 1.3.0.
 * @implements SafeProxyFactoryContract_v1_3_0_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.3.0.
 */
class SafeProxyFactoryContract_v1_3_0
  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>
  implements SafeProxyFactoryContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactoryContract_v1_3_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_3_0_Abi,
    runner?: PublicClient | null
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = safeProxyFactory_1_3_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      runner
    )

    this.safeVersion = safeVersion
  }

  /**
   * Allows to retrieve the creation code used for the Proxy deployment. With this it is easily possible to calculate predicted address.
   * @returns Array[creationCode]
   */
  proxyCreationCode: SafeProxyFactoryContract_v1_3_0_Function<'proxyCreationCode'> = async () => {
    return [await this.contract.read.proxyCreationCode()]
  }

  /**
   * Allows to retrieve the runtime code of a deployed Proxy. This can be used to check that the expected Proxy was deployed.
   * @returns Array[runtimeCode]
   */
  proxyRuntimeCode: SafeProxyFactoryContract_v1_3_0_Function<'proxyRuntimeCode'> = async () => {
    return [await this.contract.read.proxyRuntimeCode()]
  }

  /**
   * Allows to get the address for a new proxy contact created via `createProxyWithNonce`.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxyAddress]
   */
  calculateCreateProxyWithNonceAddress: SafeProxyFactoryContract_v1_3_0_Function<'calculateCreateProxyWithNonceAddress'> =
    async (args) => {
      return [await this.contract.write.calculateCreateProxyWithNonceAddress(args)]
    }

  /**
   * Allows to create new proxy contact and execute a message call to the new proxy within one transaction.
   * @param args - Array[singleton, data]
   * @returns Array[proxyAddress]
   */
  createProxy: SafeProxyFactoryContract_v1_3_0_Function<'createProxy'> = async (args) => {
    return [await this.contract.write.createProxy(args)]
  }

  /**
   * Allows to create new proxy contract, execute a message call to the new proxy and call a specified callback within one transaction.
   * @param args - Array[singleton, initializer, saltNonce, callback]
   * @returns Array[proxyAddress]
   */
  createProxyWithCallback: SafeProxyFactoryContract_v1_3_0_Function<'createProxyWithCallback'> =
    async (args) => {
      return [await this.contract.write.createProxyWithCallback(args)]
    }

  /**
   * Allows to create new proxy contract and execute a message call to the new proxy within one transaction.
   * @param args - Array[singleton, initializer, saltNonce]
   * @returns Array[proxyAddress]
   */
  createProxyWithNonce: SafeProxyFactoryContract_v1_3_0_Function<'createProxyWithNonce'> = async (
    args
  ) => {
    return [await this.contract.write.createProxyWithNonce(args)]
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

    if (options && !options.gasLimit) {
      options.gasLimit = (
        await this.estimateGas(
          'createProxyWithNonce',
          [safeSingletonAddress, initializer, saltNonceBigInt],
          { ...options }
        )
      ).toString()
    }

    const proxyAddress = this.contract.write
      .createProxyWithNonce(safeSingletonAddress, initializer, saltNonce, { ...options })
      .then(async (txResponse) => {
        if (callback) {
          callback(txResponse.hash)
        }
        const txReceipt = await txResponse.wait()
        const events = txReceipt?.logs as EventLog[]
        const proxyCreationEvent = events.find((event) => event?.eventName === 'ProxyCreation')
        if (!proxyCreationEvent || !proxyCreationEvent.args) {
          throw new Error('SafeProxy was not deployed correctly')
        }
        const proxyAddress: string = proxyCreationEvent.args[0]
        return proxyAddress
      })
    return proxyAddress
  }
}

export default SafeProxyFactoryContract_v1_3_0
