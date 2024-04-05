import SafeBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/SafeBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import SafeContract_v1_1_1_Contract, {
  SafeContract_v1_1_1_Abi,
  SafeContract_v1_1_1_Function
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.1.1/SafeContract_v1_1_1'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import safe_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.1.1/gnosis_safe'
import { sameString } from '@safe-global/protocol-kit/utils'
import { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * SafeContract_v1_1_1_Ethers is the implementation specific to the Safe contract version 1.1.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.1.1 using Ethers.js v6.
 *
 * @extends SafeBaseContractEthers<SafeContract_v1_1_1_Abi> - Inherits from SafeBaseContractEthers with ABI specific to Safe contract version 1.1.1.
 * @implements SafeContract_v1_1_1_Contract - Implements the interface specific to Safe contract version 1.1.1.
 */
class SafeContract_v1_1_1_Ethers
  extends SafeBaseContractEthers<SafeContract_v1_1_1_Abi>
  implements SafeContract_v1_1_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_1_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.1.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_1_1_Abi
  ) {
    const safeVersion = '1.1.1'
    const defaultAbi = safe_1_1_1_ContractArtifacts.abi

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

  /**
   * @returns Array[contractName]
   */
  NAME: SafeContract_v1_1_1_Function<'NAME'> = async () => {
    return [await this.contract.NAME()]
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_1_1_Function<'VERSION'> = async () => {
    return [await this.contract.VERSION()]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_1_1_Function<'approvedHashes'> = async (args) => {
    return [await this.contract.approvedHashes(...args)]
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_1_1_Function<'domainSeparator'> = async () => {
    return [await this.contract.domainSeparator()]
  }

  /**
   * Returns array of first 10 modules.
   * @returns Array[Array[modules]]
   */
  getModules: SafeContract_v1_1_1_Function<'getModules'> = async () => {
    return [await this.contract.getModules()]
  }

  /**
   * Returns array of modules.
   * @param args - Array[start, pageSize]
   * @returns Array[Array[modules], next]
   */
  getModulesPaginated: SafeContract_v1_1_1_Function<'getModulesPaginated'> = async (args) => {
    const res = await this.contract.getModulesPaginated(...args)
    return [res.array, res.next]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_1_1_Function<'getOwners'> = async () => {
    return [await this.contract.getOwners()]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_1_1_Function<'getThreshold'> = async () => {
    return [await this.contract.getThreshold()]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_1_1_Function<'isOwner'> = async (args) => {
    return [await this.contract.isOwner(...args)]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_1_1_Function<'nonce'> = async () => {
    return [await this.contract.nonce()]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_1_1_Function<'signedMessages'> = async (args) => {
    return [await this.contract.signedMessages(...args)]
  }

  /**
   * Returns hash of a message that can be signed by owners.
   * @param args - Array[message]
   * @returns Array[messageHash]
   */
  getMessageHash: SafeContract_v1_1_1_Function<'getMessageHash'> = async (args) => {
    return [await this.contract.getMessageHash(...args)]
  }

  /**
   * Returns the bytes that are hashed to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_1_1_Function<'encodeTransactionData'> = async (args) => {
    return [await this.contract.encodeTransactionData(...args)]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_1_1_Function<'getTransactionHash'> = async (args) => {
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
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
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

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract,

      setup: (): any => {
        // setup function is labelled as `external` on the contract code, but not present on type SafeContract_v1_1_1_Contract
        return
      },

      getModules: async () => (await this.getModules())[0],

      isModuleEnabled: this.isModuleEnabled.bind(this),

      getVersion: async () => (await this.VERSION())[0],

      getAddress: this.getAddress.bind(this),

      getNonce: async () => Number((await this.nonce())[0]),

      getThreshold: async () => Number((await this.getThreshold())[0]),

      getOwners: async () => (await this.getOwners())[0],

      isOwner: async (address: string) => (await this.isOwner([address]))[0],

      getTransactionHash: async (safeTransactionData: SafeTransactionData) => {
        return (
          await this.getTransactionHash([
            safeTransactionData.to,
            BigInt(safeTransactionData.value),
            safeTransactionData.data,
            safeTransactionData.operation,
            BigInt(safeTransactionData.safeTxGas),
            BigInt(safeTransactionData.baseGas),
            BigInt(safeTransactionData.gasPrice),
            safeTransactionData.gasToken,
            safeTransactionData.refundReceiver,
            BigInt(safeTransactionData.nonce)
          ])
        )[0]
      },

      approvedHashes: async (ownerAddress: string, hash: string) =>
        (await this.approvedHashes([ownerAddress, hash]))[0],

      approveHash: this.approveHash.bind(this),

      isValidTransaction: this.isValidTransaction.bind(this),

      execTransaction: this.execTransaction.bind(this),

      encode: this.encode.bind(this),

      estimateGas: this.estimateGas.bind(this)
    }
  }
}

export default SafeContract_v1_1_1_Ethers
