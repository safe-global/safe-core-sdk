import CreateCallBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/CreateCall/CreateCallBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import {
  SafeVersion,
  CreateCallContract_v1_3_0_Abi,
  CreateCallContract_v1_3_0_Contract,
  AdapterSpecificContractFunction,
  Web3TransactionOptions,
  createCall_1_3_0_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'

/**
 * CreateCallContract_V1_3_0_Web3 is the implementation specific to the CreateCall contract version 1.3.0.
 *
 * This class specializes in handling interactions with the CreateCall contract version 1.3.0 using Web3.js.
 *
 * @extends CreateCallBaseContractWeb3<CreateCallContract_v1_3_0_Abi> - Inherits from CreateCallBaseContractWeb3 with ABI specific to CreateCall contract version 1.3.0.
 * @implements CreateCallContract_v1_3_0_Contract - Implements the interface specific to CreateCall contract version 1.3.0.
 */
class CreateCallContract_V1_3_0_Web3
  extends CreateCallBaseContractWeb3<DeepWriteable<CreateCallContract_v1_3_0_Abi>>
  implements CreateCallContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CreateCallContract_V1_3_0_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CreateCall deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: DeepWriteable<CreateCallContract_v1_3_0_Abi>
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi =
      createCall_1_3_0_ContractArtifacts.abi as DeepWriteable<CreateCallContract_v1_3_0_Abi>

    super(chainId, web3Adapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * @param args - Array[value, deploymentData]
   * @param options - Web3TransactionOptions
   * @returns Promise<Web3TransactionResult>
   */
  performCreate: AdapterSpecificContractFunction<
    CreateCallContract_v1_3_0_Abi,
    'performCreate',
    Web3TransactionOptions
  > = async (args, options) => {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('performCreate', [...args], { ...options })).toString()
    }
    const txResponse = this.contract.methods.performCreate(...args).send(options)
    return toTxResult(txResponse, options)
  }

  /**
   * @param args - Array[value, deploymentData, salt]
   * @param options - Web3TransactionOptions
   * @returns Promise<Web3TransactionResult>
   */
  performCreate2: AdapterSpecificContractFunction<
    CreateCallContract_v1_3_0_Abi,
    'performCreate2',
    Web3TransactionOptions
  > = async (args, options) => {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('performCreate2', [...args], { ...options })).toString()
    }
    const txResponse = this.contract.methods.performCreate2(...args).send(options)
    return toTxResult(txResponse, options)
  }
}

export default CreateCallContract_V1_3_0_Web3
