import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import SignMessageLibBaseContract from '@safe-global/protocol-kit/adapters/SignMessageLibBaseContract'

/**
 * Abstract class SignMessageLibBaseContractWeb3 extends SignMessageLibBaseContract to specifically integrate with the Web3.js v6 library.
 * It is designed to be instantiated for different versions of the SignMessageLib contract.
 *
 * This abstract class sets up the Web3 v6 Contract object that interacts with a SignMessageLib contract version.
 *
 * Subclasses of SignMessageLibBaseContractWeb3 are expected to represent specific versions of the SignMessageLib contract.
 *
 * @template SignMessageLibContractAbiType - The ABI type specific to the version of the SignMessageLib contract, extending InterfaceAbi from Web3.
 * @extends SignMessageLibBaseContract<SignMessageLibContractAbiType> - Extends the generic SignMessageLibBaseContract with Web3-specific implementation.
 *
 * Example subclasses:
 * - SignMessageLibContract_v1_4_1_Web3 extends SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_4_1_Abi>
 * - SignMessageLibContract_v1_3_0_Web3 extends SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContractWeb3<
  SignMessageLibContractAbiType extends AbiItem[]
> extends SignMessageLibBaseContract<SignMessageLibContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of SignMessageLibBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the SignMessageLib contract. It should be compatible with the specific version of the SignMessageLib contract.
   * @param safeVersion - The version of the SignMessageLib contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the SignMessageLib deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: SignMessageLibContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }
}

export default SignMessageLibBaseContractWeb3
