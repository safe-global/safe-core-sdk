import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import { contractName } from '@safe-global/protocol-kit/contracts/config'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { GetAddressFunction } from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import BaseContract from '@safe-global/protocol-kit/adapters/BaseContract'

/**
 * Abstract class BaseContractWeb3 extends BaseContract to specifically integrate with the Web3.js library.
 * It is designed to be instantiated for different contracts.
 *
 * This abstract class sets up the Web3 Contract object that interacts with the smart contract.
 *
 * Subclasses of BaseContractWeb3 are expected to represent specific contracts.
 *
 * @template ContractAbiType - The ABI type specific to the version of the contract, extending InterfaceAbi from Web3.
 * @extends BaseContract<ContractAbiType> - Extends the generic BaseContract with Web3-specific implementation.
 *
 * Example subclasses:
 * - SafeBaseContractWeb3<SafeContractAbiType> extends BaseContractWeb3<SafeContractAbiType>
 * - CreateCallBaseContractWeb3<CreateCallContractAbiType> extends BaseContractWeb3<CreateCallContractAbiType>
 * - SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContractAbiType> extends BaseContractWeb3<SafeProxyFactoryContractAbiType>
 */
abstract class BaseContractWeb3<
  ContractAbiType extends AbiItem[]
> extends BaseContract<ContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of BaseContractWeb3.
   *
   * @param contractName - The contract name.
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType
  ) {
    super(contractName, chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }

  getAddress: GetAddressFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }
}

export default BaseContractWeb3
