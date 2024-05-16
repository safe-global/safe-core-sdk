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
 * Abstract class SafeProxyFactoryBaseContract extends BaseContract to specifically integrate with the SafeProxyFactory contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeProxyFactoryBaseContract are expected to represent specific versions of the contract.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<SafeProxyFactoryContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - SafeProxyFactoryContract_v1_4_1  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_4_1_Abi>
 * - SafeProxyFactoryContract_v1_3_0  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactoryContract_v1_2_0  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_2_0_Abi>
 * - SafeProxyFactoryContract_v1_1_1  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_1_1_Abi>
 * - SafeProxyFactoryContract_v1_0_0  extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_0_0_Abi>
 */
abstract class SafeProxyFactoryBaseContract<
  SafeProxyFactoryContractAbiType extends InterfaceAbi & Abi
> extends BaseContract<SafeProxyFactoryContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SafeProxyFactoryBaseContract.
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
    defaultAbi: SafeProxyFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContractAbiType,
    runner?: ContractRunner | null
  ) {
    const contractName = 'safeProxyFactoryVersion'

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

export default SafeProxyFactoryBaseContract
