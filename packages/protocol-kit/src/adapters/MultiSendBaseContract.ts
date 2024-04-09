import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class MultiSendBaseContract serves as a base for creating a MultiSendBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as MultiSendBaseContractEthers, MultiSendBaseContractWeb3, and MultiSendBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from MultiSend deployments.
 *
 * @template MultiSendContractAbiType - The ABI associated with the MultiSend contract.
 *
 * Example subclasses extending this base class:
 * - MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi> extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
 * - MultiSendBaseContractWeb3<MultiSendContract_v1_3_0_Abi> extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
 * - MultiSendBaseContractViem<MultiSendContract_v1_3_0_Abi> extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContract<MultiSendContractAbiType> {
  contractAbi: MultiSendContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new MultiSendBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    this.contractName = 'multiSendVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as MultiSendContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default MultiSendBaseContract
