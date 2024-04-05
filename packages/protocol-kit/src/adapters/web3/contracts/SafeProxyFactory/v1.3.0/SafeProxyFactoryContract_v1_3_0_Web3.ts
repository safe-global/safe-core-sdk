import { TransactionReceipt } from 'web3-core/types'
import SafeProxyFactoryBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/SafeProxyFactory/SafeProxyFactoryBaseContractWeb3'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  SafeVersion,
  SafeProxyFactoryContract_v1_3_0_Abi,
  SafeProxyFactoryContract_v1_3_0_Contract,
  safeProxyFactory_1_3_0_ContractArtifacts,
  EncodeFunction,
  EstimateGasFunction,
  Web3TransactionOptions,
  GetAddressFunction
} from '@safe-global/safe-core-sdk-types'

/**
 * SafeProxyFactoryContract_v1_3_0_Web3 is the implementation specific to the Safe Proxy Factory contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe Proxy Factory contract version 1.3.0 using Web3.js.
 *
 * @extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi> - Inherits from SafeProxyFactoryBaseContractWeb3 with ABI specific to Safe Proxy Factory contract version 1.3.0.
 * @implements SafeProxyFactoryContract_v1_3_0_Contract - Implements the interface specific to Safe Proxy Factory contract version 1.3.0.
 */
class SafeProxyFactoryContract_v1_3_0_Web3
  extends SafeProxyFactoryBaseContractWeb3<DeepWriteable<SafeProxyFactoryContract_v1_3_0_Abi>>
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
    customContractAbi?: DeepWriteable<SafeProxyFactoryContract_v1_3_0_Abi>
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi =
      safeProxyFactory_1_3_0_ContractArtifacts.abi as DeepWriteable<SafeProxyFactoryContract_v1_3_0_Abi>

    super(chainId, web3Adapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  encode: EncodeFunction<SafeProxyFactoryContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasFunction<SafeProxyFactoryContract_v1_3_0_Abi, Web3TransactionOptions> =
    async (functionToEstimate, args, options = {}) => {
      return await this.contract.methods[functionToEstimate](...args).estimateGas(options)
    }

  getAddress: GetAddressFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }

  async proxyCreationCode(): Promise<[string]> {
    return [await this.contract.methods.proxyCreationCode().call()]
  }

  async proxyRuntimeCode(): Promise<[string]> {
    return [await this.contract.methods.proxyRuntimeCode().call()]
  }

  async calculateCreateProxyWithNonceAddress(
    args: readonly [singleton: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.methods.calculateCreateProxyWithNonceAddress(...args).call()]
  }

  async createProxy(args: readonly [singleton: string, data: string]): Promise<[string]> {
    return [await this.contract.methods.createProxy(...args).call()]
  }

  async createProxyWithCallback(
    args: readonly [singleton: string, initializer: string, saltNonce: bigint, callback: string]
  ): Promise<[string]> {
    return [await this.contract.methods.createProxyWithCallback(...args).call()]
  }

  async createProxyWithNonce(
    args: readonly [singleton: string, initializer: string, saltNonce: bigint]
  ): Promise<[string]> {
    return [await this.contract.methods.createProxyWithNonce(...args).call()]
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
    options?: Web3TransactionOptions
    callback?: (txHash: string) => void
  }): Promise<string> {
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
}

export default SafeProxyFactoryContract_v1_3_0_Web3
