import CreateCallBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/CreateCall/CreateCallBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  DeepWriteable,
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import CreateCallContract_v1_4_1_Contract, {
  CreateCallContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/CreateCall/v1.4.1/CreateCallContract_v1_4_1'
import CreateCall_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CreateCall/v1.4.1/create_call'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeCreateCallFunction,
  EstimateGasCreateCallFunction,
  GetAddressCreateCallFunction
} from '@safe-global/protocol-kit/contracts/AbiType/CreateCall/CreateCallBaseContract'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'

/**
 * CreateCallContract_V1_4_1_Web3 is the implementation specific to the CreateCall contract version 1.4.1.
 *
 * This class specializes in handling interactions with the CreateCall contract version 1.4.1 using Web3.js.
 *
 * @extends CreateCallBaseContractWeb3<CreateCallContract_v1_4_1_Abi> - Inherits from CreateCallBaseContractWeb3 with ABI specific to CreateCall contract version 1.4.1.
 * @implements CreateCallContract_v1_4_1_Contract - Implements the interface specific to CreateCall contract version 1.4.1.
 */
class CreateCallContract_V1_4_1_Web3
  extends CreateCallBaseContractWeb3<DeepWriteable<CreateCallContract_v1_4_1_Abi>>
  implements CreateCallContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CreateCallContract_V1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CreateCall deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: CreateCallContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi =
      CreateCall_1_4_1_ContractArtifacts.abi as DeepWriteable<CreateCallContract_v1_4_1_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as DeepWriteable<CreateCallContract_v1_4_1_Abi>
    )

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressCreateCallFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }

  encode: EncodeCreateCallFunction<CreateCallContract_v1_4_1_Abi> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasCreateCallFunction<
    CreateCallContract_v1_4_1_Abi,
    Web3TransactionOptions
  > = async (functionToEstimate, args, options = {}) => {
    return (
      await this.contract.methods[functionToEstimate](...args).estimateGas(options)
    ).toString()
  }

  async performCreate(
    args: readonly [value: bigint, deploymentData: string],
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('performCreate', args, { ...options })).toString()
    }
    const txResponse = this.contract.methods.performCreate(...args).send(options)
    return toTxResult(txResponse, options)
  }

  async performCreate2(
    args: readonly [value: bigint, deploymentData: string, salt: string],
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('performCreate2', args, { ...options })).toString()
    }
    const txResponse = this.contract.methods.performCreate2(...args).send(options)
    return toTxResult(txResponse, options)
  }

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract,

      getAddress: this.getAddress.bind(this),

      encode: this.encode.bind(this),

      estimateGas: async (...args: Parameters<typeof this.estimateGas>) =>
        (await this.estimateGas(...args)).toString(),

      performCreate: async (
        value: string,
        deploymentData: string,
        options?: Web3TransactionOptions
      ) => this.performCreate([BigInt(value), deploymentData], options),

      performCreate2: async (
        value: string,
        deploymentData: string,
        salt: string,
        options?: Web3TransactionOptions
      ) => this.performCreate2([BigInt(value), deploymentData, salt], options)
    }
  }
}

export default CreateCallContract_V1_4_1_Web3
