import SafeBaseContract from '@safe-global/protocol-kit/contracts/Safe/SafeBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import {
  SafeVersion,
  SafeContract_v1_2_0_Abi,
  SafeContract_v1_2_0_Contract,
  SafeContract_v1_2_0_Function,
  SafeTransaction,
  safe_1_2_0_ContractArtifacts,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'

/**
 * SafeContract_v1_2_0  is the implementation specific to the Safe contract version 1.2.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.2.0 using Ethers.js v6.
 *
 * @extends SafeBaseContract<SafeContract_v1_2_0_Abi> - Inherits from SafeBaseContract with ABI specific to Safe contract version 1.2.0.
 * @implements SafeContract_v1_2_0_Contract - Implements the interface specific to Safe contract version 1.2.0.
 */
class SafeContract_v1_2_0
  extends SafeBaseContract<SafeContract_v1_2_0_Abi>
  implements SafeContract_v1_2_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_2_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.2.0 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_2_0_Abi
  ) {
    const safeVersion = '1.2.0'
    const defaultAbi = safe_1_2_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi
    )

    this.safeVersion = safeVersion
  }

  /**
   * @returns Array[contractName]
   */
  NAME: SafeContract_v1_2_0_Function<'NAME'> = async () => {
    return [await this.contract.NAME()]
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_2_0_Function<'VERSION'> = async () => {
    return [await this.contract.VERSION()]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_2_0_Function<'approvedHashes'> = async (args) => {
    return [await this.contract.approvedHashes(...args)]
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_2_0_Function<'domainSeparator'> = async () => {
    return [await this.contract.domainSeparator()]
  }

  /**
   * Returns array of first 10 modules.
   * @returns Array[Array[modules]]
   */
  getModules: SafeContract_v1_2_0_Function<'getModules'> = async () => {
    return [await this.contract.getModules()]
  }

  /**
   * Returns array of modules.
   * @param args - Array[start, pageSize]
   * @returns Array[Array[modules], next]
   */
  getModulesPaginated: SafeContract_v1_2_0_Function<'getModulesPaginated'> = async (args) => {
    const res = await this.contract.getModulesPaginated(...args)
    return [res.array, res.next]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_2_0_Function<'getOwners'> = async () => {
    return [await this.contract.getOwners()]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_2_0_Function<'getThreshold'> = async () => {
    return [await this.contract.getThreshold()]
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param args - Array[moduleAddress]
   * @returns Array[isEnabled]
   */
  isModuleEnabled: SafeContract_v1_2_0_Function<'isModuleEnabled'> = async (args) => {
    return [await this.contract.isModuleEnabled(...args)]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_2_0_Function<'isOwner'> = async (args) => {
    return [await this.contract.isOwner(...args)]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_2_0_Function<'nonce'> = async () => {
    return [await this.contract.nonce()]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_2_0_Function<'signedMessages'> = async (args) => {
    return [await this.contract.signedMessages(...args)]
  }

  /**
   * @param args - Array[message]
   * @returns Array[messageHash]
   */
  getMessageHash: SafeContract_v1_2_0_Function<'getMessageHash'> = async (args) => {
    return [await this.contract.getMessageHash(...args)]
  }

  /**
   * Encodes the data for a transaction to the Safe contract.
   *
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_2_0_Function<'encodeTransactionData'> = async (args) => {
    return [await this.contract.encodeTransactionData(...args)]
  }

  /**
   * Returns hash to be signed by owners.
   *
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_2_0_Function<'getTransactionHash'> = async (args) => {
    return [await this.contract.getTransactionHash(...args)]
  }

  /**
   * Marks a hash as approved. This can be used to validate a hash that is used by a signature.
   * @param hash - The hash that should be marked as approved for signatures that are verified by this contract.
   * @param options - Optional transaction options.
   * @returns Transaction result.
   */
  async approveHash(hash: string, options?: TransactionOptions): Promise<TransactionResult> {
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
    options?: TransactionOptions
  ): Promise<TransactionResult> {
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
   * Returns the chain id of the Safe contract. (Custom method - not defined in the Safe Contract)
   * @returns Array[chainId]
   */
  async getChainId(): Promise<[bigint]> {
    return [await this.contract.getChainId()]
  }

  /**
   * Checks whether a given Safe transaction can be executed successfully with no errors.
   * @param safeTransaction - The Safe transaction to check.
   * @param options - Optional transaction options.
   * @returns True, if the given transactions is valid.
   */
  async isValidTransaction(safeTransaction: SafeTransaction, options: TransactionOptions = {}) {
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

  /**
   * returns the version of the Safe contract.
   *
   * @returns {Promise<SafeVersion>} A promise that resolves to the version of the Safe contract as string.
   */
  async getVersion(): Promise<SafeVersion> {
    const [safeVersion] = await this.VERSION()
    return safeVersion as SafeVersion
  }

  /**
   * returns the nonce of the Safe contract.
   *
   * @returns {Promise<bigint>} A promise that resolves to the nonce of the Safe contract.
   */
  async getNonce(): Promise<bigint> {
    const [nonce] = await this.nonce()
    return nonce
  }
}

export default SafeContract_v1_2_0
