import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import SignMessageLibBaseContract from '@safe-global/protocol-kit/contracts/SignMessageLib/SignMessageLibBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  SafeContractFunction,
  SignMessageLibContract_v1_4_1_Abi,
  SignMessageLibContract_v1_4_1_Contract,
  SignMessageLibContract_v1_4_1_Function,
  signMessageLib_1_4_1_ContractArtifacts
} from '@safe-global/types-kit'

/**
 * SignMessageLibContract_v1_4_1  is the implementation specific to the SignMessageLib contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SignMessageLib contract version 1.4.1 using Ethers.js v6.
 *
 * @extends  SignMessageLibBaseContract<SignMessageLibContract_v1_4_1_Abi> - Inherits from  SignMessageLibBaseContract with ABI specific to SignMessageLib contract version 1.4.1.
 * @implements SignMessageLibContract_v1_4_1_Contract - Implements the interface specific to SignMessageLib contract version 1.4.1.
 */
class SignMessageLibContract_v1_4_1
  extends SignMessageLibBaseContract<SignMessageLibContract_v1_4_1_Abi>
  implements SignMessageLibContract_v1_4_1_Contract
{
  /**
   * Constructs an instance of SignMessageLibContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContract_v1_4_1_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = signMessageLib_1_4_1_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }

  /**
   * @param args - Array[message]
   */
  getMessageHash: SignMessageLibContract_v1_4_1_Function<'getMessageHash'> = async (args) => {
    return [await this.read('getMessageHash', args)]
  }

  /**
   * @param args - Array[data]
   */
  signMessage: SafeContractFunction<SignMessageLibContract_v1_4_1_Abi, 'signMessage'> = async (
    data,
    options
  ) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(await this.estimateGas('signMessage', data, { ...options }))
    }

    return toTxResult(this.runner!, await this.write('signMessage', data, options), options)
  }
}

export default SignMessageLibContract_v1_4_1
