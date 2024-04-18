import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import SignMessageLibBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SignMessageLib/SignMessageLibBaseContractEthers'
import {
  SafeVersion,
  SignMessageLibContract_v1_4_1_Abi,
  SignMessageLibContract_v1_4_1_Contract,
  SignMessageLibContract_v1_4_1_Function,
  signMessageLib_1_4_1_ContractArtifacts,
  EthersTransactionOptions,
  EncodeFunction,
} from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'

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
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = signMessageLib_1_4_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }
  encode: EncodeFunction<readonly [{ readonly anonymous: false; readonly inputs: readonly [{ readonly indexed: true; readonly internalType: 'bytes32'; readonly name: 'msgHash'; readonly type: 'bytes32' }]; readonly name: 'SignMsg'; readonly type: 'event' }, { ... }, { ... }], 'getMessageHash' | 'signMessage'>
  getAddress: GetAddressFunction
  estimateGas: EstimateGasFunction<readonly [{ readonly anonymous: false; readonly inputs: readonly [{ readonly indexed: true; readonly internalType: 'bytes32'; readonly name: 'msgHash'; readonly type: 'bytes32' }]; readonly name: 'SignMsg'; readonly type: 'event' }, { ... }, { ... }]>

  /**
   * @param args - Array[message]
   */
  getMessageHash: SignMessageLibContract_v1_4_1_Function<'getMessageHash'> = async (args) => {
    return [await this.contract.getMessageHash(...args)]
  }

  /**
   * @param args - Array[data]
   */
  signMessage: AdapterSpecificContractFunction<
    SignMessageLibContract_v1_4_1_Abi,
    'signMessage',
    EthersTransactionOptions
  > = async (data, options) => {
    if (options && !options.gasLimit) {
      options.gasLimit = Number(await this.estimateGas('signMessage', data, { ...options }))
    }

    const txResponse = await this.contract.signMessage(data, { ...options })

    return toTxResult(txResponse, options)
  }
}

export default SignMessageLibContract_v1_4_1_Ethers
