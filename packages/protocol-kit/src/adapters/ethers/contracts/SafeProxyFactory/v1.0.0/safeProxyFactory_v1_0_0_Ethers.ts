import { ContractRunner, EventLog } from 'ethers'
import SafeProxyFactoryBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SafeProxyFactory/safeProxyFactoryBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import safeProxyFactory_1_0_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.0.0/proxy_factory'
import {
  EncodeSafeProxyFactoryFunction,
  EstimateGasSafeProxyFactoryFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/safeProxyFactoryContract'
import SafeProxyFactoryContract_v1_0_0_Contract, {
  SafeProxyFactoryContract_v1_0_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * SafeProxyFactory_v1_0_0_Ethers is the implementation specific to the Safe Proxy Factory contract version 1.0.0.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.0.0 using Ethers.js v6.
 *
 * @extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_0_0_Abi> - Inherits from SafeProxyFactoryBaseContractEthers with ABI specific to Safe Proxy Factory contract version 1.0.0.
 * @implements SafeProxyFactoryContract_v1_0_0_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.0.0.
 */
class SafeProxyFactory_v1_0_0_Ethers
  extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_0_0_Abi>
  implements SafeProxyFactoryContract_v1_0_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactory_v1_0_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.0.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_0_0_Abi,
    runner?: ContractRunner | null
  ) {
    const safeVersion = '1.0.0'
    const defaultAbi = safeProxyFactory_1_0_0_ContractArtifacts.abi

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

  encode: EncodeSafeProxyFactoryFunction<SafeProxyFactoryContract_v1_0_0_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasSafeProxyFactoryFunction<
    SafeProxyFactoryContract_v1_0_0_Abi,
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

  async createProxy(args: readonly [masterCopy: string, data: string]): Promise<[string]> {
    return [await this.contract.createProxy(...args)]
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

export default SafeProxyFactory_v1_0_0_Ethers
