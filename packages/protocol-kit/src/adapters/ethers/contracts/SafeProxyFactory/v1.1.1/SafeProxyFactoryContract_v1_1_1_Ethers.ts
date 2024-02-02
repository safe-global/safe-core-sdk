import { ContractRunner, EventLog } from 'ethers'
import SafeProxyFactoryBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/SafeProxyFactoryBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import safeProxyFactory_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.1.1/proxy_factory'
import {
  EncodeSafeProxyFactoryFunction,
  EstimateGasSafeProxyFactoryFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/SafeProxyFactoryBaseContract'
import SafeProxyFactoryContract_v1_1_1_Contract, {
  SafeProxyFactoryContract_v1_1_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * SafeProxyFactoryContract_v1_1_1_Ethers is the implementation specific to the Safe Proxy Factory contract version 1.1.1.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.1.1 using Ethers.js v6.
 *
 * @extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_1_1_Abi> - Inherits from SafeProxyFactoryBaseContractEthers with ABI specific to Safe Proxy Factory contract version 1.1.1.
 * @implements SafeProxyFactoryContract_v1_1_1_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.1.1.
 */
class SafeProxyFactoryContract_v1_1_1_Ethers
  extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_1_1_Abi>
  implements SafeProxyFactoryContract_v1_1_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactoryContract_v1_1_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.1.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_1_1_Abi,
    runner?: ContractRunner | null
  ) {
    const safeVersion = '1.1.1'
    const defaultAbi = safeProxyFactory_1_1_1_ContractArtifacts.abi

    super(
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      runner
    )

    this.safeVersion = safeVersion
  }

  encode: EncodeSafeProxyFactoryFunction<SafeProxyFactoryContract_v1_1_1_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasSafeProxyFactoryFunction<
    SafeProxyFactoryContract_v1_1_1_Abi,
    EthersTransactionOptions
  > = (functionToEstimate, args, options = {}) => {
    const contractMethodToStimate = this.contract.getFunction(functionToEstimate)

    return contractMethodToStimate.estimateGas(...args, options)
  }

  getAddress(): Promise<string> {
    return this.contract.getAddress()
  }

  async proxyCreationCode(): Promise<[string]> {
    return [await this.contract.proxyCreationCode()]
  }

  async proxyRuntimeCode(): Promise<[string]> {
    return [await this.contract.proxyRuntimeCode()]
  }

  async calculateCreateProxyWithNonceAddress(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.calculateCreateProxyWithNonceAddress(...args)]
  }

  async createProxy(args: readonly [masterCopy: string, data: string]): Promise<[string]> {
    return [await this.contract.createProxy(...args)]
  }

  async createProxyWithCallback(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint, callback: string]
  ): Promise<[string]> {
    return [await this.contract.createProxyWithCallback(...args)]
  }

  async createProxyWithNonce(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.createProxyWithNonce(...args)]
  }

  async createProxyWithOptions({
    safeSingletonAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: {
    safeSingletonAddress: string
    initializer: string
    saltNonce: string
    options?: EthersTransactionOptions
    callback?: (txHash: string) => void
  }): Promise<string> {
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

    const proxyAddress = this.contract
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

export default SafeProxyFactoryContract_v1_1_1_Ethers
