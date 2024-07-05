import SafeWebAuthnSharedSignerBaseContract from '@safe-global/protocol-kit/contracts/SafeWebAuthnSharedSigner/SafeWebAuthnSharedSignerBaseContract'
import {
  SafeVersion,
  SafeWebAuthnSharedSignerContract_v1_4_1_Abi,
  SafeWebAuthnSharedSignerContract_v1_4_1_Contract,
  SafeWebAuthnSharedSignerContract_v1_4_1_Function,
  SafeWebAuthnSharedSigner_1_4_1_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'

/**
 * SafeWebAuthnSharedSignerContract_v1_4_1  is the implementation specific to the SafeWebAuthnSharedSigner contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SafeWebAuthnSharedSigner contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SafeWebAuthnSharedSignerBaseContract<SafeWebAuthnSharedSignerContract_v1_4_1_Abi> - Inherits from SafeWebAuthnSharedSignerBaseContract with ABI specific to SafeWebAuthnSigner Factory contract version 1.4.1.
 * @implements SafeWebAuthnSharedSignerContract_v1_4_1_Contract - Implements the interface specific to SafeWebAuthnSharedSigner contract version 1.4.1.
 */
class SafeWebAuthnSharedSignerContract_v1_4_1
  extends SafeWebAuthnSharedSignerBaseContract<SafeWebAuthnSharedSignerContract_v1_4_1_Abi>
  implements SafeWebAuthnSharedSignerContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeWebAuthnSharedSignerContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SafeWebAuthnSharedSignerContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = SafeWebAuthnSharedSigner_1_4_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * Return the signer configuration for the specified account.
   * @param args - Array[address]
   * @returns Array[signer]
   */
  getConfiguration: SafeWebAuthnSharedSignerContract_v1_4_1_Function<'getConfiguration'> = async (
    args
  ) => {
    return [await this.contract.getConfiguration(...args)]
  }

  /**
   * Sets the signer configuration for the calling account.
   * @param args - Array[signer]
   * @returns Array[]
   */
  configure: SafeWebAuthnSharedSignerContract_v1_4_1_Function<'configure'> = async (args) => {
    await this.contract.configure(...args)
    return []
  }

  isValidSignature: SafeWebAuthnSharedSignerContract_v1_4_1_Function<'isValidSignature'> = async (
    args
  ) => {
    return [await this.contract.isValidSignature(...args)]
  }

  /**
   * @returns The starting storage slot on the account containing the signer data.
   */
  SIGNER_SLOT: SafeWebAuthnSharedSignerContract_v1_4_1_Function<'SIGNER_SLOT'> = async () => {
    return [await this.contract.SIGNER_SLOT()]
  }
}

export default SafeWebAuthnSharedSignerContract_v1_4_1
