import SafeBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/SafeBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import { sameString } from '@safe-global/protocol-kit/utils'
import {
  SafeVersion,
  SafeContract_v1_0_0_Abi,
  SafeContract_v1_0_0_Function,
  SafeTransaction,
  SafeContract_v1_0_0_Contract,
  safe_1_0_0_ContractArtifacts,
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/safe-core-sdk-types'

/**
 * SafeContract_v1_0_0_Ethers is the implementation specific to the Safe contract version 1.0.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.0.0 using Ethers.js v6.
 *
 * @extends SafeBaseContractEthers<SafeContract_v1_0_0_Abi> - Inherits from SafeBaseContractEthers with ABI specific to Safe contract version 1.0.0.
 * @implements SafeContract_v1_0_0_Contract - Implements the interface specific to Safe contract version 1.0.0.
 */
class SafeContract_v1_0_0_Ethers
  extends SafeBaseContractEthers<SafeContract_v1_0_0_Abi>
  implements SafeContract_v1_0_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_0_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.0.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_0_0_Abi
  ) {
    const safeVersion = '1.0.0'
    const defaultAbi = safe_1_0_0_ContractArtifacts.abi

    super(
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi
    )

    this.safeVersion = safeVersion
  }

  /* ----- Specific v1.0.0 properties -----  */
  DOMAIN_SEPARATOR_TYPEHASH: SafeContract_v1_0_0_Function<'DOMAIN_SEPARATOR_TYPEHASH'> =
    async () => {
      return [await this.contract.DOMAIN_SEPARATOR_TYPEHASH()]
    }

  SENTINEL_MODULES: SafeContract_v1_0_0_Function<'SENTINEL_MODULES'> = async () => {
    return [await this.contract.SENTINEL_MODULES()]
  }

  SENTINEL_OWNERS: SafeContract_v1_0_0_Function<'SENTINEL_OWNERS'> = async () => {
    return [await this.contract.SENTINEL_OWNERS()]
  }

  SAFE_MSG_TYPEHASH: SafeContract_v1_0_0_Function<'SAFE_MSG_TYPEHASH'> = async () => {
    return [await this.contract.SAFE_MSG_TYPEHASH()]
  }

  SAFE_TX_TYPEHASH: SafeContract_v1_0_0_Function<'SAFE_TX_TYPEHASH'> = async () => {
    return [await this.contract.SAFE_TX_TYPEHASH()]
  }
  /* ----- End of specific v1.0.0 properties -----  */

  /**
   * @returns Array[contractName]
   */
  NAME: SafeContract_v1_0_0_Function<'NAME'> = async () => {
    return [await this.contract.NAME()]
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_0_0_Function<'VERSION'> = async () => {
    return [await this.contract.VERSION()]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_0_0_Function<'approvedHashes'> = async (args) => {
    return [await this.contract.approvedHashes(...args)]
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_0_0_Function<'domainSeparator'> = async () => {
    return [await this.contract.domainSeparator()]
  }

  /**
   * Returns array of modules.
   * @returns Array[Array[modules]]
   */
  getModules: SafeContract_v1_0_0_Function<'getModules'> = async () => {
    return [await this.contract.getModules()]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_0_0_Function<'getOwners'> = async () => {
    return [await this.contract.getOwners()]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_0_0_Function<'getThreshold'> = async () => {
    return [await this.contract.getThreshold()]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_0_0_Function<'isOwner'> = async (args) => {
    return [await this.contract.isOwner(...args)]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_0_0_Function<'nonce'> = async () => {
    return [await this.contract.nonce()]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_0_0_Function<'signedMessages'> = async (args) => {
    return [await this.contract.signedMessages(...args)]
  }

  /**
   * Returns hash of a message that can be signed by owners.
   * @param args - Array[message]
   * @returns Array[messageHash]
   */
  getMessageHash: SafeContract_v1_0_0_Function<'getMessageHash'> = async (args) => {
    return [await this.contract.getMessageHash(...args)]
  }

  /**
   * Returns the bytes that are hashed to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_0_0_Function<'encodeTransactionData'> = async (args) => {
    return [await this.contract.encodeTransactionData(...args)]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_0_0_Function<'getTransactionHash'> = async (args) => {
    return [await this.contract.getTransactionHash(...args)]
  }

  /**
   * Marks a hash as approved. This can be used to validate a hash that is used by a signature.
   * @param hash - The hash that should be marked as approved for signatures that are verified by this contract.
   * @param options - Optional transaction options.
   * @returns Transaction result.
   */
  async approveHash(
    hash: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    const gasLimit = options?.gasLimit || (await this.estimateGas('approveHash', [hash], options))
    const txResponse = await this.contract.approveHash(hash, { ...options, gasLimit })

    return toTxResult(txResponse, options)
  }

  /**
   * Executes a transaction.
   * @param safeTransaction - The Safe transaction to execute.
   * @param options - Transaction options.
   * @returns Transaction result.
   */
  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    const gasLimit =
      options?.gasLimit ||
      (await this.estimateGas(
        'execTransaction',
        [
          safeTransaction.data.to,
          BigInt(safeTransaction.data.value),
          safeTransaction.data.data,
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          safeTransaction.data.gasToken,
          safeTransaction.data.refundReceiver,
          safeTransaction.encodedSignatures()
        ],
        options
      ))

    const txResponse = await this.contract.execTransaction(
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures(),
      { ...options, gasLimit }
    )

    return toTxResult(txResponse, options)
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param moduleAddress - The module address to check.
   * @returns True, if the module with the given address is enabled.
   */
  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const [modules] = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }

  /**
   * Checks whether a given Safe transaction can be executed successfully with no errors.
   * @param safeTransaction - The Safe transaction to check.
   * @param options - Optional transaction options.
   * @returns True, if the given transactions is valid.
   */
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options: EthersTransactionOptions = {}
  ): Promise<boolean> {
    try {
      const gasLimit =
        options?.gasLimit ||
        (await this.estimateGas(
          'execTransaction',
          [
            safeTransaction.data.to,
            BigInt(safeTransaction.data.value),
            safeTransaction.data.data,
            safeTransaction.data.operation,
            BigInt(safeTransaction.data.safeTxGas),
            BigInt(safeTransaction.data.baseGas),
            BigInt(safeTransaction.data.gasPrice),
            safeTransaction.data.gasToken,
            safeTransaction.data.refundReceiver,
            safeTransaction.encodedSignatures()
          ],
          options
        ))

      return await this.contract.execTransaction.staticCall(
        safeTransaction.data.to,
        BigInt(safeTransaction.data.value),
        safeTransaction.data.data,
        safeTransaction.data.operation,
        BigInt(safeTransaction.data.safeTxGas),
        BigInt(safeTransaction.data.baseGas),
        BigInt(safeTransaction.data.gasPrice),
        safeTransaction.data.gasToken,
        safeTransaction.data.refundReceiver,
        safeTransaction.encodedSignatures(),
        { ...options, gasLimit }
      )
    } catch (error) {
      return false
    }
  }
}

export default SafeContract_v1_0_0_Ethers
