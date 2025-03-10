import { simulateContract } from 'viem/actions'
import SafeBaseContract from '@safe-global/protocol-kit/contracts/Safe/SafeBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  SafeContract_v1_3_0_Abi,
  SafeContract_v1_3_0_Contract,
  SafeContract_v1_3_0_Function,
  SafeTransaction,
  safe_1_3_0_ContractArtifacts,
  TransactionOptions,
  TransactionResult
} from '@safe-global/types-kit'
import { asHash, asHex } from '@safe-global/protocol-kit/utils/types'
import { ContractFunctionArgs } from 'viem'

/**
 * SafeContract_v1_3_0  is the implementation specific to the Safe contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.3.0 using Ethers.js v6.
 *
 * @extends SafeBaseContract<SafeContract_v1_3_0_Abi> - Inherits from SafeBaseContract with ABI specific to Safe contract version 1.3.0.
 * @implements SafeContract_v1_3_0_Contract - Implements the interface specific to Safe contract version 1.3.0.
 */
class SafeContract_v1_3_0
  extends SafeBaseContract<SafeContract_v1_3_0_Abi>
  implements SafeContract_v1_3_0_Contract
{
  /**
   * Constructs an instance of SafeContract_v1_3_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    isL1SafeSingleton?: boolean,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_3_0_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = safe_1_3_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_3_0_Function<'VERSION'> = async () => {
    return [await this.read('VERSION')]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_3_0_Function<'approvedHashes'> = async (args) => {
    return [await this.read('approvedHashes', args)]
  }

  /**
   * Checks whether the signature provided is valid for the provided data, hash and number of required signatures.
   * Will revert otherwise.
   * @param args - Array[dataHash, data, signatures, requiredSignatures]
   * @returns Empty array
   */
  checkNSignatures: SafeContract_v1_3_0_Function<'checkNSignatures'> = async (args) => {
    await this.read('checkNSignatures', args)
    return []
  }

  /**
   * Checks whether the signature provided is valid for the provided data and hash. Will revert otherwise.
   * @param args - Array[dataHash, data, signatures]
   * @returns Empty array
   */
  checkSignatures: SafeContract_v1_3_0_Function<'checkSignatures'> = async (args) => {
    await this.read('checkSignatures', args)
    return []
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_3_0_Function<'domainSeparator'> = async () => {
    return [await this.read('domainSeparator')]
  }

  /**
   * Encodes the data for a transaction to the Safe contract.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_3_0_Function<'encodeTransactionData'> = async (args) => {
    return [await this.read('encodeTransactionData', args)]
  }

  /**
   * Returns array of modules.
   * @param args - Array[start, pageSize]
   * @returns Array[Array[modules], next]
   */
  getModulesPaginated: SafeContract_v1_3_0_Function<'getModulesPaginated'> = async (args) => {
    const [array, next] = await this.read('getModulesPaginated', args)
    return [array, next]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_3_0_Function<'getOwners'> = async () => {
    return [await this.read('getOwners')]
  }

  /**
   * Reads `length` bytes of storage in the currents contract
   * @param args - Array[offset, length]
   * @returns Array[storage]
   */
  getStorageAt: SafeContract_v1_3_0_Function<'getStorageAt'> = async (args) => {
    return [await this.read('getStorageAt', args)]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_3_0_Function<'getThreshold'> = async () => {
    return [await this.read('getThreshold')]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_3_0_Function<'getTransactionHash'> = async (args) => {
    return [await this.read('getTransactionHash', args)]
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param args - Array[moduleAddress]
   * @returns Array[isEnabled]
   */
  isModuleEnabled: SafeContract_v1_3_0_Function<'isModuleEnabled'> = async (args) => {
    return [await this.read('isModuleEnabled', args)]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_3_0_Function<'isOwner'> = async (args) => {
    return [await this.read('isOwner', args)]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_3_0_Function<'nonce'> = async () => {
    return [await this.read('nonce')]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_3_0_Function<'signedMessages'> = async (args) => {
    return [await this.read('signedMessages', args)]
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
            asHex(safeTransaction.data.data),
            safeTransaction.data.operation,
            BigInt(safeTransaction.data.safeTxGas),
            BigInt(safeTransaction.data.baseGas),
            BigInt(safeTransaction.data.gasPrice),
            safeTransaction.data.gasToken,
            safeTransaction.data.refundReceiver,
            asHex(safeTransaction.encodedSignatures())
          ],
          options
        ))

      const converted = this.convertOptions({ ...options, gasLimit })
      const txResult = await simulateContract(this.runner, {
        address: this.contractAddress,
        functionName: 'execTransaction',
        abi: this.contractAbi,
        args: [
          safeTransaction.data.to,
          BigInt(safeTransaction.data.value),
          asHex(safeTransaction.data.data),
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          safeTransaction.data.gasToken,
          safeTransaction.data.refundReceiver,
          asHex(safeTransaction.encodedSignatures())
        ],
        ...converted
      })

      return txResult.result
    } catch (error) {
      return false
    }
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
          asHex(safeTransaction.data.data),
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          safeTransaction.data.gasToken,
          safeTransaction.data.refundReceiver,
          asHex(safeTransaction.encodedSignatures())
        ],
        options
      ))

    const args: ContractFunctionArgs<SafeContract_v1_3_0_Abi, 'payable', 'execTransaction'> = [
      safeTransaction.data.to,
      BigInt(safeTransaction.data.value),
      asHex(safeTransaction.data.data),
      safeTransaction.data.operation,
      BigInt(safeTransaction.data.safeTxGas),
      BigInt(safeTransaction.data.baseGas),
      BigInt(safeTransaction.data.gasPrice),
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      asHex(safeTransaction.encodedSignatures())
    ]

    return toTxResult(
      this.runner!,
      await this.write('execTransaction', args, { ...options, gasLimit }),
      options
    )
  }

  /**
   * Returns array of first 10 modules.
   * @returns Array[modules]
   */
  async getModules(): Promise<[string[]]> {
    const [modules] = await this.getModulesPaginated([SENTINEL_ADDRESS, BigInt(10)])
    return [modules.map((module) => module)]
  }

  /**
   * Marks a hash as approved. This can be used to validate a hash that is used by a signature.
   * @param hash - The hash that should be marked as approved for signatures that are verified by this contract.
   * @param options - Optional transaction options.
   * @returns Transaction result.
   */
  async approveHash(hash: string, options?: TransactionOptions): Promise<TransactionResult> {
    const gasLimit =
      options?.gasLimit || (await this.estimateGas('approveHash', [asHash(hash)], options))

    return toTxResult(
      this.runner!,
      await this.write('approveHash', [asHash(hash)], { ...options, gasLimit }),
      options
    )
  }

  /**
   * Returns the chain id of the Safe contract. (Custom method - not defined in the Safe Contract)
   * @returns Array[chainId]
   */
  async getChainId(): Promise<[bigint]> {
    return [await Promise.resolve(this.chainId)]
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

export default SafeContract_v1_3_0
