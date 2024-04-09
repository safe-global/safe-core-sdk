import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SignMessageLibBaseContract serves as a base for creating a SignMessageLibBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as SignMessageLibBaseContractEthers, SignMessageLibBaseContractWeb3, and SignMessageLibBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from SignMessageLib deployments.
 *
 * @template SignMessageLibContractAbiType - The ABI associated with the SignMessageLib contract.
 *
 * Example subclasses extending this base class:
 * - SignMessageLibBaseContractEthers<SignMessageLibContract_v1_3_0_Abi> extends SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi>
 * - SignMessageLibBaseContractWeb3<SignMessageLibContract_v1_3_0_Abi> extends SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi>
 * - SignMessageLibBaseContractViem<SignMessageLibContract_v1_3_0_Abi> extends SignMessageLibBaseContract<SignMessageLibContract_v1_3_0_Abi>
 */
abstract class SignMessageLibBaseContract<SignMessageLibContractAbiType> {
  contractAbi: SignMessageLibContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new SignMessageLibBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the SignMessageLib contract.
   * @param safeVersion - The version of the SignMessageLib contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: SignMessageLibContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SignMessageLibContractAbiType
  ) {
    this.contractName = 'signMessageLibVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as SignMessageLibContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default SignMessageLibBaseContract
