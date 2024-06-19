import { Abi } from 'abitype'
import { ContractRunner, InterfaceAbi } from 'ethers'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import {
  SafeVersion,
  TransactionOptions,
  CreateProxyProps as CreateProxyPropsGeneral
} from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

export interface CreateProxyProps extends CreateProxyPropsGeneral {
  options?: TransactionOptions
}

/**
 * Abstract class SafeWebAuthnSignerFactoryBaseContract extends BaseContract to specifically integrate with the SafeWebAuthnSignerFactory contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeWebAuthnSignerFactoryBaseContract are expected to represent specific versions of the contract.
 *
 * @template SafeWebAuthnSignerFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<SafeWebAuthnSignerFactoryContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - SafeWebAuthnSignerFactoryContract_v1_4_1  extends SafeWebAuthnSignerFactoryBaseContract<SafeWebAuthnSignerFactoryContract_v1_4_1_Abi>
 */
abstract class SafeWebAuthnSignerFactoryBaseContract<
  SafeWebAuthnSignerFactoryContractAbiType extends InterfaceAbi & Abi
> extends BaseContract<SafeWebAuthnSignerFactoryContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SafeWebAuthnSignerFactoryBaseContract.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: SafeWebAuthnSignerFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeWebAuthnSignerFactoryContractAbiType,
    runner?: ContractRunner | null
  ) {
    const contractName = 'safeWebAuthnSignerFactoryVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      runner
    )

    this.contractName = contractName
  }
}

export default SafeWebAuthnSignerFactoryBaseContract
