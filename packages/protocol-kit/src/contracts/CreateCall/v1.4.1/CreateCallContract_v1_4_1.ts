import CreateCallBaseContract from '@safe-global/protocol-kit/contracts/CreateCall/CreateCallBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  SafeVersion,
  CreateCallContract_v1_4_1_Abi,
  CreateCallContract_v1_4_1_Contract,
  createCall_1_4_1_ContractArtifacts,
  SafeContractFunction
} from '@safe-global/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'

/**
 * CreateCallContract_v1_4_1  is the implementation specific to the CreateCall contract version 1.4.1.
 *
 * This class specializes in handling interactions with the CreateCall contract version 1.4.1 using Ethers.js v6.
 *
 * @extends CreateCallBaseContract<CreateCallContract_v1_4_1_Abi> - Inherits from CreateCallBaseContract with ABI specific to CreateCall contract version 1.4.1.
 * @implements CreateCallContract_v1_4_1_Contract - Implements the interface specific to CreateCall contract version 1.4.1.
 */
class CreateCallContract_v1_4_1
  extends CreateCallBaseContract<CreateCallContract_v1_4_1_Abi>
  implements CreateCallContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CreateCallContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CreateCall deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: CreateCallContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = createCall_1_4_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * @param args - Array[value, deploymentData]
   * @param options - TransactionOptions
   * @returns Promise<TransactionResult>
   */
  performCreate: SafeContractFunction<CreateCallContract_v1_4_1_Abi, 'performCreate'> = async (
    args,
    options
  ) => {
    if (options && !options.gasLimit) {
      options.gasLimit = (await this.estimateGas('performCreate', args, options)).toString()
    }
    const txResponse = await this.contract.performCreate(...args, options)
    return toTxResult(txResponse, options)
  }

  /**
   * @param args - Array[value, deploymentData, salt]
   * @param options - TransactionOptions
   * @returns Promise<TransactionResult>
   */
  performCreate2: SafeContractFunction<CreateCallContract_v1_4_1_Abi, 'performCreate2'> = async (
    args,
    options
  ) => {
    if (options && !options.gasLimit) {
      options.gasLimit = (
        await this.estimateGas('performCreate2', [...args], { ...options })
      ).toString()
    }
    const txResponse = await this.contract.performCreate2(...args)
    return toTxResult(txResponse, options)
  }
}

export default CreateCallContract_v1_4_1
