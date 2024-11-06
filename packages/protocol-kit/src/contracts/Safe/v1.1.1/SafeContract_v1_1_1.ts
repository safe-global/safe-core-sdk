import { simulateContract } from 'viem/actions'
import SafeBaseContract from '@safe-global/protocol-kit/contracts/Safe/SafeBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import { sameString } from '@safe-global/protocol-kit/utils'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  SafeContract_v1_1_1_Abi,
  SafeContract_v1_1_1_Contract,
  SafeContract_v1_1_1_Function,
  SafeTransaction,
  safe_1_1_1_ContractArtifacts,
  TransactionOptions,
  TransactionResult
} from '@safe-global/types-kit'
import { asHash, asHex } from '@safe-global/protocol-kit/utils/types'
import { ContractFunctionArgs } from 'viem'

/**
 * SafeContract_v1_1_1  is the implementation specific to the Safe contract version 1.1.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.1.1 using Ethers.js v6.
 *
 * @extends SafeBaseContract<SafeContract_v1_1_1_Abi> - Inherits from SafeBaseContract with ABI specific to Safe contract version 1.1.1.
 * @implements SafeContract_v1_1_1_Contract - Implements the interface specific to Safe contract version 1.1.1.
 */
class SafeContract_v1_1_1
  extends SafeBaseContract<SafeContract_v1_1_1_Abi>
  implements SafeContract_v1_1_1_Contract
{
  /**
   * Constructs an instance of SafeContract_v1_1_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.1.1 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    isL1SafeSingleton?: boolean,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_1_1_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.1.1'
    const defaultAbi = safe_1_1_1_ContractArtifacts.abi

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
   * @returns Array[contractName]
   */
  NAME: SafeContract_v1_1_1_Function<'NAME'> = async () => {
    return [await this.read('NAME')]
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_1_1_Function<'VERSION'> = async () => {
    return [await this.read('VERSION')]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_1_1_Function<'approvedHashes'> = async (args) => {
    return [await this.read('approvedHashes', args)]
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_1_1_Function<'domainSeparator'> = async () => {
    return [await this.read('domainSeparator')]
  }

  /**
   * Returns array of first 10 modules.
   * @returns Array[Array[modules]]
   */
  getModules: SafeContract_v1_1_1_Function<'getModules'> = async () => {
    return [await this.read('getModules')]
  }

  /**
   * Returns array of modules.
   * @param args - Array[start, pageSize]
   * @returns Array[Array[modules], next]
   */
  getModulesPaginated: SafeContract_v1_1_1_Function<'getModulesPaginated'> = async (args) => {
    const [array, next] = await this.read('getModulesPaginated', args)
    return [array, next]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_1_1_Function<'getOwners'> = async () => {
    return [await this.read('getOwners')]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_1_1_Function<'getThreshold'> = async () => {
    return [await this.read('getThreshold')]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_1_1_Function<'isOwner'> = async (args) => {
    return [await this.read('isOwner', args)]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_1_1_Function<'nonce'> = async () => {
    return [await this.read('nonce')]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_1_1_Function<'signedMessages'> = async (args) => {
    return [await this.read('signedMessages', args)]
  }

  /**
   * Returns hash of a message that can be signed by owners.
   * @param args - Array[message]
   * @returns Array[messageHash]
   */
  getMessageHash: SafeContract_v1_1_1_Function<'getMessageHash'> = async (args) => {
    return [await this.read('getMessageHash', args)]
  }

  /**
   * Returns the bytes that are hashed to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_1_1_Function<'encodeTransactionData'> = async (args) => {
    return [await this.read('encodeTransactionData', args)]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_1_1_Function<'getTransactionHash'> = async (args) => {
    return [await this.read('getTransactionHash', args)]
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

    const args: ContractFunctionArgs<SafeContract_v1_1_1_Abi, 'nonpayable', 'execTransaction'> = [
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
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param moduleAddress - The module address to check.
   * @returns True, if the module with the given address is enabled.
   */
  async isModuleEnabled([moduleAddress]: [string]): Promise<[boolean]> {
    const [modules] = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return [isModuleEnabled]
  }

  /**
   * Checks whether a given Safe transaction can be executed successfully with no errors.
   * @param safeTransaction - The Safe transaction to check.
   * @param options - Optional transaction options.
   * @returns True, if the given transactions is valid.
   */
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options: TransactionOptions = {}
  ): Promise<boolean> {
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
   * returns the nonce of the Safe contract.
   *
   * @returns {Promise<bigint>} A promise that resolves to the nonce of the Safe contract.
   */
  async getNonce(): Promise<bigint> {
    const [nonce] = await this.nonce()
    return nonce
  }
}

export default SafeContract_v1_1_1
