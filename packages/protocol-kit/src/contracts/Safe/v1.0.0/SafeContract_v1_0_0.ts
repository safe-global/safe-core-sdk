import SafeBaseContract from '@safe-global/protocol-kit/contracts/Safe/SafeBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { toTxResult } from '@safe-global/protocol-kit/contracts/utils'
import { sameString, isSentinelAddress } from '@safe-global/protocol-kit/utils'
import {
  SafeVersion,
  SafeContract_v1_0_0_Abi,
  SafeContract_v1_0_0_Function,
  SafeTransaction,
  SafeContract_v1_0_0_Contract,
  safe_1_0_0_ContractArtifacts,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { asAddress, asHash, asHex } from '@safe-global/protocol-kit/utils/types'
import { Address } from 'viem'

/**
 * SafeContract_v1_0_0  is the implementation specific to the Safe contract version 1.0.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.0.0 using Ethers.js v6.
 *
 * @extends SafeBaseContract<SafeContract_v1_0_0_Abi> - Inherits from SafeBaseContract with ABI specific to Safe contract version 1.0.0.
 * @implements SafeContract_v1_0_0_Contract - Implements the interface specific to Safe contract version 1.0.0.
 */
class SafeContract_v1_0_0
  extends SafeBaseContract<SafeContract_v1_0_0_Abi>
  implements SafeContract_v1_0_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_0_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.0.0 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_0_0_Abi
  ) {
    const safeVersion = '1.0.0'
    const defaultAbi = safe_1_0_0_ContractArtifacts.abi

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

  /* ----- Specific v1.0.0 properties -----  */
  DOMAIN_SEPARATOR_TYPEHASH: SafeContract_v1_0_0_Function<'DOMAIN_SEPARATOR_TYPEHASH'> =
    async () => {
      return [
        await this.runner.readContract({
          functionName: 'DOMAIN_SEPARATOR_TYPEHASH',
          abi: this.contractAbi,
          address: asAddress(this.contractAddress)
        })
      ]
    }

  SENTINEL_MODULES: SafeContract_v1_0_0_Function<'SENTINEL_MODULES'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'SENTINEL_MODULES',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  SENTINEL_OWNERS: SafeContract_v1_0_0_Function<'SENTINEL_OWNERS'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'SENTINEL_OWNERS',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  SAFE_MSG_TYPEHASH: SafeContract_v1_0_0_Function<'SAFE_MSG_TYPEHASH'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'SAFE_MSG_TYPEHASH',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  SAFE_TX_TYPEHASH: SafeContract_v1_0_0_Function<'SAFE_TX_TYPEHASH'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'SAFE_TX_TYPEHASH',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }
  /* ----- End of specific v1.0.0 properties -----  */

  /**
   * @returns Array[contractName]
   */
  NAME: SafeContract_v1_0_0_Function<'NAME'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'NAME',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_0_0_Function<'VERSION'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'VERSION',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_0_0_Function<'approvedHashes'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'approvedHashes',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_0_0_Function<'domainSeparator'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'domainSeparator',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * Returns array of modules.
   * @returns Array[Array[modules]]
   */
  getModules: SafeContract_v1_0_0_Function<'getModules'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'getModules',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_0_0_Function<'getOwners'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'getOwners',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_0_0_Function<'getThreshold'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'getThreshold',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_0_0_Function<'isOwner'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'isOwner',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_0_0_Function<'nonce'> = async () => {
    return [
      await this.runner.readContract({
        functionName: 'nonce',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress)
      })
    ]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_0_0_Function<'signedMessages'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'signedMessages',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * Returns hash of a message that can be signed by owners.
   * @param args - Array[message]
   * @returns Array[messageHash]
   */
  getMessageHash: SafeContract_v1_0_0_Function<'getMessageHash'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'getMessageHash',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * Returns the bytes that are hashed to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_0_0_Function<'encodeTransactionData'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'encodeTransactionData',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_0_0_Function<'getTransactionHash'> = async (args) => {
    return [
      await this.runner.readContract({
        functionName: 'getTransactionHash',
        abi: this.contractAbi,
        address: asAddress(this.contractAddress),
        args
      })
    ]
  }

  /**
   * Marks a hash as approved. This can be used to validate a hash that is used by a signature.
   * @param hash - The hash that should be marked as approved for signatures that are verified by this contract.
   * @param options - Optional transaction options.
   * @returns Transaction result.
   */
  async approveHash(hash: string, options?: TransactionOptions): Promise<TransactionResult> {
    if (!this.wallet) throw new Error()
    const gasLimit =
      options?.gasLimit || (await this.estimateGas('approveHash', [asHash(hash)], options))

    const converted = await this.convertOptions({
      ...options,
      gasLimit
    })

    const txResponse = await this.wallet?.writeContract({
      functionName: 'approveHash',
      address: asAddress(this.contractAddress),
      abi: this.contractAbi,
      args: [asHash(hash)],
      ...converted
    })

    return toTxResult(this.runner!, txResponse, options)
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
          asAddress(safeTransaction.data.to),
          BigInt(safeTransaction.data.value),
          asHex(safeTransaction.data.data),
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          asAddress(safeTransaction.data.gasToken),
          asAddress(safeTransaction.data.refundReceiver),
          asHex(safeTransaction.encodedSignatures())
        ],
        options
      ))

    const txResponse = await this.contract.write.execTransaction(
      [
        asAddress(safeTransaction.data.to),
        BigInt(safeTransaction.data.value),
        asHex(safeTransaction.data.data),
        safeTransaction.data.operation,
        BigInt(safeTransaction.data.safeTxGas),
        BigInt(safeTransaction.data.baseGas),
        BigInt(safeTransaction.data.gasPrice),
        asAddress(safeTransaction.data.gasToken),
        asAddress(safeTransaction.data.refundReceiver),
        asHex(safeTransaction.encodedSignatures())
      ],
      await this.convertOptions({ ...options, gasLimit })
    )

    return toTxResult(this.runner!, txResponse, options)
  }

  async getModulesPaginated([start, pageSize]: [Address, bigint]): Promise<[string[], string]> {
    if (pageSize <= 0) throw new Error('Invalid page size for fetching paginated modules')

    const size = Number(pageSize)
    const [array] = await this.getModules()

    if (isSentinelAddress(start)) {
      const next = pageSize < array.length ? array[size] : SENTINEL_ADDRESS
      return [array.slice(0, size), next]
    } else {
      const moduleIndex = array.findIndex((module: string) => sameString(module, start))
      if (moduleIndex === -1) {
        return [[], SENTINEL_ADDRESS]
      }

      const nextElementIndex = moduleIndex + 1
      const nextPageAddress =
        nextElementIndex + size < array.length ? array[nextElementIndex + size] : SENTINEL_ADDRESS
      return [array.slice(moduleIndex + 1, nextElementIndex + size), nextPageAddress]
    }
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param moduleAddress - The module address to check.
   * @returns True, if the module with the given address is enabled.
   */
  async isModuleEnabled([moduleAddress]: [Address]): Promise<[boolean]> {
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
            asAddress(safeTransaction.data.to),
            BigInt(safeTransaction.data.value),
            asHex(safeTransaction.data.data),
            safeTransaction.data.operation,
            BigInt(safeTransaction.data.safeTxGas),
            BigInt(safeTransaction.data.baseGas),
            BigInt(safeTransaction.data.gasPrice),
            asAddress(safeTransaction.data.gasToken),
            asAddress(safeTransaction.data.refundReceiver),
            asHex(safeTransaction.encodedSignatures())
          ],
          options
        ))

      const converted = await this.convertOptions({ ...options, gasLimit })
      const txResult = await this.runner.simulateContract({
        address: asAddress(this.contractAddress),
        functionName: 'execTransaction',
        abi: this.contractAbi,
        args: [
          asAddress(safeTransaction.data.to),
          BigInt(safeTransaction.data.value),
          asHex(safeTransaction.data.data),
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          asAddress(safeTransaction.data.gasToken),
          asAddress(safeTransaction.data.refundReceiver),
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

export default SafeContract_v1_0_0
