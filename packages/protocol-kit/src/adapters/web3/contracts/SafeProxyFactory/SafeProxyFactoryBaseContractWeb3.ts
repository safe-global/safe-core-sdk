import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { contractName } from '@safe-global/protocol-kit/contracts/config'
import {
  CreateProxyProps as CreateProxyPropsGeneral,
  SafeVersion,
  Web3TransactionOptions
} from '@safe-global/safe-core-sdk-types'

export interface CreateProxyProps extends CreateProxyPropsGeneral {
  options?: Web3TransactionOptions
}

/**
 * Abstract class SafeProxyFactoryBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the SafeProxyFactory contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeProxyFactoryBaseContractWeb3 are expected to represent specific versions of the contract.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending AbiItem[].
 * @extends BaseContractWeb3<SafeProxyFactoryContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - SafeProxyFactoryContract_v1_4_1_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_4_1_Abi>
 * - SafeProxyFactoryContract_v1_3_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactoryContract_v1_2_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_2_0_Abi>
 * - SafeProxyFactoryContract_v1_1_1_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_1_1_Abi>
 * - SafeProxyFactoryContract_v1_0_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_0_0_Abi>
 */
abstract class SafeProxyFactoryBaseContractWeb3<
  SafeProxyFactoryContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<SafeProxyFactoryContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SafeProxyFactoryBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: SafeProxyFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContractAbiType
  ) {
    const contractName = 'safeProxyFactoryVersion'

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

export default SafeProxyFactoryBaseContractWeb3
