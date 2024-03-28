import CreateCallBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/CreateCall/CreateCallBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import CreateCallContract_v1_3_0_Contract, {
  CreateCallContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/CreateCall/v1.3.0/CreateCallContract_v1_3_0'
import CreateCall_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CreateCall/v1.3.0/create_call'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * CreateCallContract_V1_3_0_Ethers is the implementation specific to the CreateCall contract version 1.3.0.
 *
 * This class specializes in handling interactions with the CreateCall contract version 1.3.0 using Ethers.js v6.
 *
 * @extends CreateCallBaseContractEthers<CreateCallContract_v1_3_0_Abi> - Inherits from CreateCallBaseContractEthers with ABI specific to CreateCall contract version 1.3.0.
 * @implements CreateCallContract_v1_3_0_Contract - Implements the interface specific to CreateCall contract version 1.3.0.
 */
class CreateCallContract_V1_3_0_Ethers
  extends CreateCallBaseContractEthers<CreateCallContract_v1_3_0_Abi>
  implements CreateCallContract_v1_3_0_Contract<EthersAdapter>
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CreateCallContract_V1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CreateCall deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: CreateCallContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = CreateCall_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<CreateCallContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasFunction<CreateCallContract_v1_3_0_Abi, EthersTransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractMethodToEstimate = this.contract.getFunction(functionToEstimate)

    return contractMethodToEstimate.estimateGas(...args, options)
  }

  async performCreate(
    args: readonly [value: bigint, deploymentData: string],
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = (await this.estimateGas('performCreate', args, { ...options })).toString()
    }
    const txResponse = await this.contract.performCreate(...args, { ...options })
    return toTxResult(txResponse, options)
  }

  async performCreate2(
    args: readonly [value: bigint, deploymentData: string, salt: string],
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = (await this.estimateGas('performCreate2', args, { ...options })).toString()
    }
    const txResponse = await this.contract.performCreate2(...args)
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
        options?: EthersTransactionOptions
      ) => this.performCreate([BigInt(value), deploymentData], options),

      performCreate2: async (
        value: string,
        deploymentData: string,
        salt: string,
        options?: EthersTransactionOptions
      ) => this.performCreate2([BigInt(value), deploymentData, salt], options)
    }
  }
}

export default CreateCallContract_V1_3_0_Ethers
