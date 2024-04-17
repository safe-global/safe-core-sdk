import { Abi } from 'abitype'
import { InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SignMessageLibBaseContractEthers extends BaseContractEthers to specifically integrate with the SignMessageLib contract.
 * It is designed to be instantiated for different versions of the SignMessageLib contract.
 *
 * Subclasses of SignMessageLibBaseContractEthers are expected to represent specific versions of the SignMessageLib contract.
 *
 * @template SignMessageLibContractAbiType - The ABI type specific to the version of the SignMessageLib contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<SignMessageLibContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - SignMessageLibContract_v1_4_1_Ethers extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_4_1_Abi>
 * - SignMessageLibContract_v1_3_0_Ethers extends SignMessageLibBaseContractEthers<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContractEthers<
  SignMessageLibContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<SignMessageLibContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SignMessageLibBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the SignMessageLib contract. It should be compatible with the specific version of the SignMessageLib contract.
   * @param safeVersion - The version of the SignMessageLib contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SignMessageLib deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the SignMessageLib deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: SignMessageLibContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContractAbiType
  ) {
    const contractName = 'signMessageLibVersion'

    super(
      contractName,
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default SignMessageLibBaseContractEthers
