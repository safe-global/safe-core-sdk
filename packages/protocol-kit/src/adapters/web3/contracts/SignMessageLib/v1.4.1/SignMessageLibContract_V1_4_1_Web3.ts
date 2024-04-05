import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import SignMessageLibBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/SignMessageLib/SignMessageLibBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  SafeVersion,
  AdapterSpecificContractFunction,
  ContractFunction,
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SignMessageLibContract_v1_4_1_Abi,
  SignMessageLibContract_v1_4_1_Contract,
  Web3TransactionOptions,
  signMessageLib_1_4_1_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'

/**
 * SignMessageLibContract_v1_4_1_Web3 is the implementation specific to the SignMessageLib contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SignMessageLib contract version 1.4.1 using Web3.js v6.
 *
 * @extends SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_4_1_Abi> - Inherits from SignMessageLibBaseContractWeb3 with ABI specific to SignMessageLib contract version 1.4.1.
 * @implements SignMessageLibContract_v1_4_1_Contract - Implements the interface specific to SignMessageLib contract version 1.4.1.
 */
class SignMessageLibContract_v1_4_1_Web3
  extends SignMessageLibBaseContractWeb3<DeepWriteable<SignMessageLibContract_v1_4_1_Abi>>
  implements SignMessageLibContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SignMessageLibContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: DeepWriteable<SignMessageLibContract_v1_4_1_Abi>
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi =
      signMessageLib_1_4_1_ContractArtifacts.abi as DeepWriteable<SignMessageLibContract_v1_4_1_Abi>

    super(chainId, web3Adapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  encode: EncodeFunction<SignMessageLibContract_v1_4_1_Abi> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasFunction<SignMessageLibContract_v1_4_1_Abi, Web3TransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    return this.contract.methods[functionToEstimate](...args)
      .estimateGas(options)
      .then(BigInt)
  }

  getAddress: GetAddressFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }

  /**
   * @param args - Array[message]
   */
  getMessageHash: ContractFunction<SignMessageLibContract_v1_4_1_Abi, 'getMessageHash'> = async (
    args
  ) => {
    return [await this.contract.methods.getMessageHash(...args).call()]
  }

  /**
   * @param args - Array[data]
   */
  signMessage: AdapterSpecificContractFunction<
    SignMessageLibContract_v1_4_1_Abi,
    'signMessage',
    Web3TransactionOptions
  > = async (data, options) => {
    if (options && !options.gas) {
      options.gas = Number(await this.estimateGas('signMessage', data, { ...options }))
    }

    const txResponse = this.contract.methods.signMessage(data).send(options)

    return toTxResult(txResponse, options)
  }
}

export default SignMessageLibContract_v1_4_1_Web3
