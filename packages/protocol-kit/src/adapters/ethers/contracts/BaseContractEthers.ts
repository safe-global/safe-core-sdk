import { Abi } from 'abitype'
import { Contract, ContractRunner, InterfaceAbi } from 'ethers'

import { contractName } from '@safe-global/protocol-kit/contracts/config'
import BaseContract from '@safe-global/protocol-kit/adapters/BaseContract'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'

/**
 * Abstract class BaseContractEthers extends BaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different contracts.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with the smart contract.
 *
 * Subclasses of BaseContractEthers are expected to represent specific contracts.
 *
 * @template ContractAbiType - The ABI type specific to the version of the contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<ContractAbiType> - Extends the generic BaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - SafeBaseContractEthers<SafeContractAbiType> extends BaseContractEthers<SafeContractAbiType>
 * - CreateCallBaseContractEthers<CreateCallContractAbiType> extends BaseContractEthers<CreateCallContractAbiType>
 * - SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContractAbiType> extends BaseContractEthers<SafeProxyFactoryContractAbiType>
 */
abstract class BaseContractEthers<
  ContractAbiType extends InterfaceAbi & Abi
> extends BaseContract<ContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of BaseContractEthers.
   *
   * @param contractName - The contract name.
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType,
    runner?: ContractRunner | null
  ) {
    super(contractName, chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = ethersAdapter
    this.contract = new Contract(
      this.contractAddress,
      this.contractAbi,
      runner || this.adapter.getSigner()
    )
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<ContractAbiType> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args as ReadonlyArray<any>)
  }

  estimateGas: EstimateGasFunction<ContractAbiType, EthersTransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractMethodToEstimate = this.contract.getFunction(functionToEstimate)
    return contractMethodToEstimate.estimateGas(...(args as ReadonlyArray<any>), options)
  }
}

export default BaseContractEthers
