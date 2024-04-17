import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SignMessageLibBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the SignMessageLib contract.
 * It is designed to be instantiated for different versions of the SignMessageLib contract.
 *
 * Subclasses of SignMessageLibBaseContractWeb3 are expected to represent specific versions of the SignMessageLib contract.
 *
 * @template SignMessageLibContractAbiType - The ABI type specific to the version of the SignMessageLib contract, extending InterfaceAbi from Web3.
 * @extends BaseContractWeb3<SignMessageLibContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - SignMessageLibContract_v1_4_1_Web3 extends SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_4_1_Abi>
 * - SignMessageLibContract_v1_3_0_Web3 extends SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContractWeb3<
  SignMessageLibContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<SignMessageLibContractAbiType> {
  contractName: contractName

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
    const contractName = 'signMessageLibVersion'

    super(
      contractName,
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default SignMessageLibBaseContractWeb3
