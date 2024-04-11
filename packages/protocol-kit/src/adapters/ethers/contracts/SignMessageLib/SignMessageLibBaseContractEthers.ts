import { AbstractSigner, Contract, InterfaceAbi } from 'ethers'

import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import SignMessageLibBaseContract from '@safe-global/protocol-kit/adapters/SignMessageLibBaseContract'

/**
 * Abstract class SignMessageLibBaseContractEthers extends SignMessageLibBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the SignMessageLib contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a SignMessageLib contract version.
 *
 * Subclasses of SignMessageLibBaseContractEthers are expected to represent specific versions of the SignMessageLib contract.
 *
 * @template SignMessageLibContractAbiType - The ABI type specific to the version of the SignMessageLib contract, extending InterfaceAbi from Ethers.
 * @extends SignMessageLibBaseContract<SignMessageLibContractAbiType> - Extends the generic SignMessageLibBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - SignMessageLibContract_v1_4_1_Ethers extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_4_1_Abi>
 * - SignMessageLibContract_v1_3_0_Ethers extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContractEthers<
  SignMessageLibContractAbiType extends InterfaceAbi
> extends SignMessageLibBaseContract<SignMessageLibContractAbiType> {
  contract: Contract

  /**
   * @constructor
   * Constructs an instance of SignMessageLibBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the SignMessageLib contract. It should be compatible with the specific version of the SignMessageLib contract.
   * @param safeVersion - The version of the SignMessageLib contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the SignMessageLib deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    signer: AbstractSigner,
    defaultAbi: SignMessageLibContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.contract = new Contract(this.contractAddress, this.contractAbi, signer)
  }
}

export default SignMessageLibBaseContractEthers
