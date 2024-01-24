import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import SignMessageLibBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SignMessageLib/SignMessageLibBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import SignMessageLibContract_v1_4_1_Contract, {
  SignMessageLibContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1'
import multisend_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SignMessageLib/v1.4.1/sign_message_lib'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeSignMessageLibFunction,
  EstimateGasSignMessageLibFunction,
  GetAddressSignMessageLibFunction,
  SignMessageFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SignMessageLib/SignMessageLibBaseContract'

/**
 * SignMessageLibContract_v1_4_1_Ethers is the implementation specific to the SignMessageLib contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SignMessageLib contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_4_1_Abi> - Inherits from SignMessageLibBaseContractEthers with ABI specific to SignMessageLib contract version 1.4.1.
 * @implements SignMessageLibContract_v1_4_1_Contract - Implements the interface specific to SignMessageLib contract version 1.4.1.
 */
class SignMessageLibContract_v1_4_1_Ethers
  extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_4_1_Abi>
  implements SignMessageLibContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SignMessageLibContract_v1_4_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = multisend_1_4_1_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  encode: EncodeSignMessageLibFunction<SignMessageLibContract_v1_4_1_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasSignMessageLibFunction<
    SignMessageLibContract_v1_4_1_Abi,
    EthersTransactionOptions
  > = (functionToEstimate, args, options = {}) => {
    const contractMethodToEstimate = this.contract.getFunction(functionToEstimate)

    return contractMethodToEstimate.estimateGas(...args, options)
  }

  getAddress: GetAddressSignMessageLibFunction = () => {
    return this.contract.getAddress()
  }

  async getMessageHash(args: readonly [string]): Promise<readonly [string]> {
    return [await this.contract.getMessageHash(...args)]
  }

  signMessage: SignMessageFunction<SignMessageLibContract_v1_4_1_Abi, EthersTransactionOptions> =
    async (data, options) => {
      if (options && !options.gasLimit) {
        options.gasLimit = Number(await this.estimateGas('signMessage', data, { ...options }))
      }

      const txResponse = await this.contract.signMessage(data, { ...options })

      return toTxResult(txResponse, options)
    }
}

export default SignMessageLibContract_v1_4_1_Ethers
