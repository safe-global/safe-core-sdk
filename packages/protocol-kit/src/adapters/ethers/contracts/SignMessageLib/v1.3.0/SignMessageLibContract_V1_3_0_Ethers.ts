import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import SignMessageLibBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SignMessageLib/SignMessageLibBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  AdapterSpecificContractFunction,
  ContractFunction,
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SafeVersion,
  SignMessageLibContract_v1_3_0_Abi,
  SignMessageLibContract_v1_3_0_Contract,
  signMessageLib_1_3_0_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'

/**
 * SignMessageLibContract_v1_3_0_Ethers is the implementation specific to the SignMessageLib contract version 1.3.0.
 *
 * This class specializes in handling interactions with the SignMessageLib contract version 1.3.0 using Ethers.js v6.
 *
 * @extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_3_0_Abi> - Inherits from SignMessageLibBaseContractEthers with ABI specific to SignMessageLib contract version 1.3.0.
 * @implements SignMessageLibContract_v1_3_0_Contract - Implements the interface specific to SignMessageLib contract version 1.3.0.
 */
class SignMessageLibContract_v1_3_0_Ethers
  extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_3_0_Abi>
  implements SignMessageLibContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SignMessageLibContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = signMessageLib_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  encode: EncodeFunction<SignMessageLibContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasFunction<SignMessageLibContract_v1_3_0_Abi, EthersTransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractMethodToEstimate = this.contract.getFunction(functionToEstimate)

    return contractMethodToEstimate.estimateGas(...args, options)
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  /**
   * @param args - Array[message]
   */
  getMessageHash: ContractFunction<SignMessageLibContract_v1_3_0_Abi, 'getMessageHash'> = async (
    args
  ) => {
    return [await this.contract.getMessageHash(...args)]
  }

  /**
   * @param args - Array[data]
   */
  signMessage: AdapterSpecificContractFunction<SignMessageLibContract_v1_3_0_Abi, 'signMessage'> =
    async (data, options?: EthersTransactionOptions) => {
      if (options && !options.gasLimit) {
        options.gasLimit = Number(await this.estimateGas('signMessage', data, { ...options }))
      }

      const txResponse = await this.contract.signMessage(data, { ...options })

      return toTxResult(txResponse, options)
    }
}

export default SignMessageLibContract_v1_3_0_Ethers
