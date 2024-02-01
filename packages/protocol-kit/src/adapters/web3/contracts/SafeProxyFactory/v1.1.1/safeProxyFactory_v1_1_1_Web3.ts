import { TransactionReceipt } from 'web3-core/types'
import SafeProxyFactoryBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/safeProxyFactoryBaseContractWeb3'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import {
  DeepWriteable,
  Web3TransactionOptions
} from '@safe-global/protocol-kit/adapters/web3/types'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safeProxyFactory_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SafeProxyFactory/v1.1.1/proxy_factory'
import {
  EncodeSafeProxyFactoryFunction,
  EstimateGasSafeProxyFactoryFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/SafeProxyFactoryBaseContract'
import SafeProxyFactoryContract_v1_1_1_Contract, {
  SafeProxyFactoryContract_v1_1_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1'
import {
  CreateProxyProps as CreateProxyPropsGeneral,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'

export interface CreateProxyProps extends CreateProxyPropsGeneral {
  options?: Web3TransactionOptions
}

/**
 * SafeProxyFactory_v1_1_1_Web3 is the implementation specific to the Safe Proxy Factory contract version 1.1.1.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.1.1 using Web3.js.
 *
 * @extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_1_1_Abi> - Inherits from SafeProxyFactoryBaseContractWeb3 with ABI specific to Safe Proxy Factory contract version 1.1.1.
 * @implements SafeProxyFactoryContract_v1_1_1_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.1.1.
 */
class SafeProxyFactory_v1_1_1_Web3
  extends SafeProxyFactoryBaseContractWeb3<DeepWriteable<SafeProxyFactoryContract_v1_1_1_Abi>>
  implements SafeProxyFactoryContract_v1_1_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeProxyFactory_v1_1_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.1.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContract_v1_1_1_Abi
  ) {
    const safeVersion = '1.1.1'
    const defaultAbi =
      safeProxyFactory_1_1_1_ContractArtifacts.abi as DeepWriteable<SafeProxyFactoryContract_v1_1_1_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as DeepWriteable<SafeProxyFactoryContract_v1_1_1_Abi>
    )

    this.safeVersion = safeVersion
  }

  encode: EncodeSafeProxyFactoryFunction<SafeProxyFactoryContract_v1_1_1_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasSafeProxyFactoryFunction<
    SafeProxyFactoryContract_v1_1_1_Abi,
    Web3TransactionOptions
  > = async (functionToEstimate, args, options = {}) => {
    return await this.contract.methods[functionToEstimate](...args).estimateGas(options)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.contract.options.address)
  }

  async proxyCreationCode(): Promise<[string]> {
    return [await this.contract.methods.proxyCreationCode().call()]
  }

  async proxyRuntimeCode(): Promise<[string]> {
    return [await this.contract.methods.proxyRuntimeCode().call()]
  }

  async calculateCreateProxyWithNonceAddress(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.methods.calculateCreateProxyWithNonceAddress(...args).call()]
  }

  async createProxy(args: readonly [masterCopy: string, data: string]): Promise<[string]> {
    return [await this.contract.methods.createProxy(...args).call()]
  }

  async createProxyWithCallback(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint, callback: string]
  ): Promise<[string]> {
    return [await this.contract.methods.createProxyWithCallback(...args).call()]
  }

  async createProxyWithNonce(
    args: readonly [masterCopy: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.methods.createProxyWithNonce(...args).call()]
  }

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

export default SafeProxyFactory_v1_1_1_Web3
