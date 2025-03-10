import { Abi } from 'abitype'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { SafeVersion } from '@safe-global/types-kit'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SafeWebAuthnSharedSignerBaseContract extends BaseContract to specifically integrate with the SafeWebAuthnSharedSigner contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeWebAuthnSharedSignerBaseContract are expected to represent specific versions of the contract.
 *
 * @template SafeWebAuthnSharedSignerContractAbiType - The ABI type specific to the version of the Safe WebAuthn Shared Signer contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<SafeWebAuthnSharedSignerContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - SafeWebAuthnSharedSignerContract_v0_2_1  extends SafeWebAuthnSharedSignerBaseContract<SafeWebAuthnSharedSignerContract_v0_2_1_Abi>
 */
abstract class SafeWebAuthnSharedSignerBaseContract<
  SafeWebAuthnSharedSignerContractAbiType extends Abi
> extends BaseContract<SafeWebAuthnSharedSignerContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SafeWebAuthnSharedSignerBaseContract.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: SafeWebAuthnSharedSignerContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeWebAuthnSharedSignerContractAbiType,
    deploymentType?: DeploymentType
  ) {
    const contractName = 'safeWebAuthnSharedSignerVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )

    this.contractName = contractName
  }
}

export default SafeWebAuthnSharedSignerBaseContract
