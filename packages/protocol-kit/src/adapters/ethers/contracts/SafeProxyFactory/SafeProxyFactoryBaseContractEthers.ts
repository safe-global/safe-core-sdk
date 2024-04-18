import { Abi } from 'abitype'
import { ContractRunner, InterfaceAbi } from 'ethers'
import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'
import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import {
  SafeVersion,
  EthersTransactionOptions,
  CreateProxyProps as CreateProxyPropsGeneral
} from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

export interface CreateProxyProps extends CreateProxyPropsGeneral {
  options?: EthersTransactionOptions
}

/**
 * Abstract class SafeProxyFactoryBaseContractEthers extends BaseContractEthers to specifically integrate with the SafeProxyFactory contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeProxyFactoryBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<SafeProxyFactoryContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - SafeProxyFactoryContract_v1_4_1_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_4_1_Abi>
 * - SafeProxyFactoryContract_v1_3_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactoryContract_v1_2_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_2_0_Abi>
 * - SafeProxyFactoryContract_v1_1_1_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_1_1_Abi>
 * - SafeProxyFactoryContract_v1_0_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_0_0_Abi>
 */
abstract class SafeProxyFactoryBaseContractEthers<
  SafeProxyFactoryContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<SafeProxyFactoryContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SafeProxyFactoryBaseContractEthers.
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

export default SafeProxyFactoryBaseContractEthers
