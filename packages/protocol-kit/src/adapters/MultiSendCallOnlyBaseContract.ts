import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class MultiSendCallOnlyBaseContract serves as a base for creating a MultiSendCallOnlyBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as MultiSendCallOnlyBaseContractEthers, MultiSendCallOnlyBaseContractWeb3, and MultiSendCallOnlyBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from MultiSendCallOnly deployments.
 *
 * @template MultiSendCallOnlyContractAbiType - The ABI associated with the MultiSendCallOnly contract.
 *
 * Example subclasses extending this base class:
 * - MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_3_0_Abi> extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_3_0_Abi>
 * - MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_3_0_Abi> extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_3_0_Abi>
 * - MultiSendCallOnlyBaseContractViem<MultiSendCallOnlyContract_v1_3_0_Abi> extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_3_0_Abi>
 */
abstract class MultiSendCallOnlyBaseContract<MultiSendCallOnlyContractAbiType> {
  contractAbi: MultiSendCallOnlyContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter

  /**
   * Constructs a new MultiSendCallOnlyBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the MultiSendCallOnly contract.
   * @param safeVersion - The version of the MultiSendCallOnly contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: MultiSendCallOnlyContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContractAbiType
  ) {
    this.contractName = 'multiSendCallOnlyVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as MultiSendCallOnlyContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default MultiSendCallOnlyBaseContract
