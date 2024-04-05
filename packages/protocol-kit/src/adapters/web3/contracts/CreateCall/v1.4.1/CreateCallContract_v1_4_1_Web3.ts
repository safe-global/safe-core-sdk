import CreateCallBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/CreateCall/CreateCallBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  DeepWriteable,
  Web3TransactionOptions
} from '@safe-global/protocol-kit/adapters/web3/types'
import CreateCallContract_v1_4_1_Contract, {
  CreateCallContract_v1_4_1_Abi as CreateCallContract_v1_4_1_Abi_Readonly
} from '@safe-global/protocol-kit/contracts/AbiType/CreateCall/v1.4.1/CreateCallContract_v1_4_1'
import CreateCall_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CreateCall/v1.4.1/create_call'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { AdapterSpecificContractFunction } from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

// Remove all nested `readonly` modifiers from the ABI type
type CreateCallContract_v1_4_1_Abi = DeepWriteable<CreateCallContract_v1_4_1_Abi_Readonly>

/**
 * CreateCallContract_V1_4_1_Web3 is the implementation specific to the CreateCall contract version 1.4.1.
 *
 * This class specializes in handling interactions with the CreateCall contract version 1.4.1 using Web3.js.
 *
 * @extends CreateCallBaseContractWeb3<CreateCallContract_v1_4_1_Abi> - Inherits from CreateCallBaseContractWeb3 with ABI specific to CreateCall contract version 1.4.1.
 * @implements CreateCallContract_v1_4_1_Contract - Implements the interface specific to CreateCall contract version 1.4.1.
 */
class CreateCallContract_V1_4_1_Web3
  extends CreateCallBaseContractWeb3<CreateCallContract_v1_4_1_Abi>
  implements CreateCallContract_v1_4_1_Contract<Web3Adapter>
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
    const defaultAbi = CreateCall_1_4_1_ContractArtifacts.abi as CreateCallContract_v1_4_1_Abi

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as CreateCallContract_v1_4_1_Abi
    )

    this.safeVersion = safeVersion
  }

  /**
   * @param args - Array[value, deploymentData]
   * @param options - Web3TransactionOptions
   * @returns Promise<Web3TransactionResult>
   */
  performCreate: AdapterSpecificContractFunction<CreateCallContract_v1_4_1_Abi, Web3Adapter> =
    async (args, options) => {
      if (options && !options.gas) {
        options.gas = (
          await this.estimateGas('performCreate', [...args], { ...options })
        ).toString()
      }
      const txResponse = this.contract.methods.performCreate(...args).send(options)
      return toTxResult(txResponse, options)
    }

  /**
   * @param args - Array[value, deploymentData, salt]
   * @param options - Web3TransactionOptions
   * @returns Promise<Web3TransactionResult>
   */
  performCreate2: AdapterSpecificContractFunction<CreateCallContract_v1_4_1_Abi, Web3Adapter> =
    async (args, options) => {
      if (options && !options.gas) {
        options.gas = (
          await this.estimateGas('performCreate2', [...args], { ...options })
        ).toString()
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
