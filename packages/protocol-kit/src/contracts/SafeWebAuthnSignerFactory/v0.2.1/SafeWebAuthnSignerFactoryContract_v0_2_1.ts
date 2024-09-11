import SafeWebAuthnSignerFactoryBaseContract from '@safe-global/protocol-kit/contracts/SafeWebAuthnSignerFactory/SafeWebAuthnSignerFactoryBaseContract'
import {
  SafeVersion,
  SafeWebAuthnSignerFactoryContract_v0_2_1_Abi,
  SafeWebAuthnSignerFactoryContract_v0_2_1_Contract,
  SafeWebAuthnSignerFactoryContract_v0_2_1_Function,
  SafeWebAuthnSignerFactory_0_2_1_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'

/**
 * SafeWebAuthnSignerFactoryContract_v0_2_1  is the implementation specific to the SafeWebAuthnSigner Factory contract version 0.2.1.
 *
 * This class specializes in handling interactions with the SafeWebAuthnSigner Factory contract version 0.2.1 using Ethers.js v6.
 *
 * @extends SafeWebAuthnSignerFactoryBaseContract<SafeWebAuthnSignerFactoryContract_v0_2_1_Abi> - Inherits from SafeWebAuthnSignerFactoryBaseContract with ABI specific to SafeWebAuthnSigner Factory contract version 0.2.1.
 * @implements SafeWebAuthnSignerFactoryContract_v0_2_1_Contract - Implements the interface specific to SafeWebAuthnSigner Factory contract version 0.2.1.
 */
class SafeWebAuthnSignerFactoryContract_v0_2_1
  extends SafeWebAuthnSignerFactoryBaseContract<SafeWebAuthnSignerFactoryContract_v0_2_1_Abi>
  implements SafeWebAuthnSignerFactoryContract_v0_2_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeWebAuthnSignerFactoryContract_v0_2_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 0.2.1 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeWebAuthnSignerFactoryContract_v0_2_1_Abi
  ) {
    const defaultAbi = SafeWebAuthnSignerFactory_0_2_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * Returns the address of the Signer.
   * @param args - Array[x, y, verifiers]
   * @returns Array[signer]
   */
  getSigner: SafeWebAuthnSignerFactoryContract_v0_2_1_Function<'getSigner'> = async (args) => {
    return [await this.read('getSigner', args)]
  }

  /**
   * Returns the address of the Signer and deploy the signer contract if its not deployed yet.
   * @param args - Array[x, y, verifiers]
   * @returns Array[signer]
   */
  createSigner: SafeWebAuthnSignerFactoryContract_v0_2_1_Function<'createSigner'> = async (
    args
  ) => {
    return [await this.write('createSigner', args)]
  }

  isValidSignatureForSigner: SafeWebAuthnSignerFactoryContract_v0_2_1_Function<'isValidSignatureForSigner'> =
    async (args) => {
      return [await this.read('isValidSignatureForSigner', args)]
    }
}

export default SafeWebAuthnSignerFactoryContract_v0_2_1
