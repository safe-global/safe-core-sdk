import { Abi } from 'abitype'

import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class  SignMessageLibBaseContract extends BaseContract to specifically integrate with the SignMessageLib contract.
 * It is designed to be instantiated for different versions of the SignMessageLib contract.
 *
 * Subclasses of  SignMessageLibBaseContract are expected to represent specific versions of the SignMessageLib contract.
 *
 * @template SignMessageLibContractAbiType - The ABI type specific to the version of the SignMessageLib contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<SignMessageLibContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - SignMessageLibContract_v1_4_1  extends  SignMessageLibBaseContract<SignMessageLibContract_v1_4_1_Abi>
 * - SignMessageLibContract_v1_3_0  extends  SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContract<
  SignMessageLibContractAbiType extends Abi
> extends BaseContract<SignMessageLibContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of  SignMessageLibBaseContract.
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
    safeProvider: SafeProvider,
    defaultAbi: SignMessageLibContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContractAbiType
  ) {
    const contractName = 'signMessageLibVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default SignMessageLibBaseContract
