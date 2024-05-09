import { Abi } from 'abitype'
import { Contract, ContractRunner, InterfaceAbi } from 'ethers'

import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class BaseContract
 * It is designed to be instantiated for different contracts.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with the smart contract.
 *
 * Subclasses of BaseContract are expected to represent specific contracts.
 *
 * @template ContractAbiType - The ABI type specific to the version of the contract, extending InterfaceAbi from Ethers.
 *
 * Example subclasses:
 * - SafeBaseContract<SafeContractAbiType> extends BaseContract<SafeContractAbiType>
 * - CreateCallBaseContract<CreateCallContractAbiType> extends BaseContract<CreateCallContractAbiType>
 * - SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> extends BaseContract<SafeProxyFactoryContractAbiType>
 */
class BaseContract<ContractAbiType extends InterfaceAbi & Abi> {
  contractAbi: ContractAbiType
  contractAddress: string
  contractName: contractName
  safeVersion: SafeVersion
  safeProvider: SafeProvider
  contract!: Contract
  runner?: ContractRunner | null

  /**
   * @constructor
   * Constructs an instance of BaseContract.
   *
   * @param contractName - The contract name.
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType,
    runner?: ContractRunner | null
  ) {
    const deployment = getContractDeployment(safeVersion, chainId, contractName)

    const contractAddress =
      customContractAddress ||
      deployment?.networkAddresses[chainId.toString()] ||
      deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error(`Invalid ${contractName.replace('Version', '')} contract address`)
    }

    this.contractName = contractName
    this.safeVersion = safeVersion
    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as unknown as ContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi

    this.runner = runner || safeProvider.getExternalProvider()
    this.safeProvider = safeProvider
  }

  async init() {
    this.contract = new Contract(
      this.contractAddress,
      this.contractAbi,
      (await this.safeProvider.getExternalSigner()) || this.runner
    )
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<ContractAbiType> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args as ReadonlyArray<[]>)
  }

  estimateGas: EstimateGasFunction<ContractAbiType> = (functionToEstimate, args, options = {}) => {
    const contractMethodToEstimate = this.contract.getFunction(functionToEstimate)
    return contractMethodToEstimate.estimateGas(...(args as ReadonlyArray<[]>), options)
  }
}

export default BaseContract
