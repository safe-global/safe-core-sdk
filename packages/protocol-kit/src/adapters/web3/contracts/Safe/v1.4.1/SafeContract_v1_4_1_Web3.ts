import SafeBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/SafeBaseContractWeb3'
import {
  DeepWriteable,
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/adapters/web3/utils/constants'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safe_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.4.1/safe_l2'
import SafeContract_v1_4_1_Contract, {
  SafeContract_v1_4_1_Abi as SafeContract_v1_4_1_Abi_Readonly,
  SafeContract_v1_4_1_Function
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.4.1/SafeContract_v1_4_1'
import { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'

// Remove all nested `readonly` modifiers from the ABI type
type SafeContract_v1_4_1_Abi = DeepWriteable<SafeContract_v1_4_1_Abi_Readonly>

/**
 * SafeContract_v1_4_1_Web3 is the implementation specific to the Safe contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.4.1 using Web3.js.
 *
 * @extends SafeBaseContractWeb3<SafeContract_v1_4_1_Abi> - Inherits from SafeBaseContractWeb3 with ABI specific to Safe contract version 1.4.1.
 * @implements SafeContract_v1_4_1_Contract - Implements the interface specific to Safe contract version 1.4.1.
 */
class SafeContract_v1_4_1_Web3
  extends SafeBaseContractWeb3<SafeContract_v1_4_1_Abi>
  implements SafeContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_4_1_Abi_Readonly
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = safe_1_4_1_ContractArtifacts.abi as SafeContract_v1_4_1_Abi

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi as SafeContract_v1_4_1_Abi
    )

    this.safeVersion = safeVersion
  }

  /**
   * @returns Array[safeContractVersion]
   */
  VERSION: SafeContract_v1_4_1_Function<'VERSION'> = async () => {
    return [await this.contract.methods.VERSION().call()]
  }

  /**
   * @param args - Array[owner, txHash]
   * @returns Array[approvedHashes]
   */
  approvedHashes: SafeContract_v1_4_1_Function<'approvedHashes'> = async (args) => {
    return [await this.contract.methods.approvedHashes(...args).call()]
  }

  /**
   * Checks whether the signature provided is valid for the provided data, hash and number of required signatures.
   * Will revert otherwise.
   * @param args - Array[dataHash, data, signatures, requiredSignatures]
   * @returns Empty array
   */
  checkNSignatures: SafeContract_v1_4_1_Function<'checkNSignatures'> = async (args) => {
    if (this.contract.methods.checkNSignatures) {
      await this.contract.methods.checkNSignatures(...args).call()
    }
    return []
  }

  /**
   * Checks whether the signature provided is valid for the provided data and hash. Will revert otherwise.
   * @param args - Array[dataHash, data, signatures]
   * @returns Empty array
   */
  checkSignatures: SafeContract_v1_4_1_Function<'checkSignatures'> = async (args) => {
    await this.contract.methods.checkSignatures(...args).call()
    return []
  }

  /**
   * @returns Array[domainSeparator]
   */
  domainSeparator: SafeContract_v1_4_1_Function<'domainSeparator'> = async () => {
    return [await this.contract.methods.domainSeparator().call()]
  }

  /**
   * Encodes the data for a transaction to the Safe contract.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[encodedData]
   */
  encodeTransactionData: SafeContract_v1_4_1_Function<'encodeTransactionData'> = async (args) => {
    return [await this.contract.methods.encodeTransactionData(...args).call()]
  }

  /**
   * Returns array of modules.
   * @param args - Array[start, pageSize]
   * @returns Array[Array[modules], next]
   */
  getModulesPaginated: SafeContract_v1_4_1_Function<'getModulesPaginated'> = async (args) => {
    const res = await this.contract.methods.getModulesPaginated(...args).call()
    return [res.array, res.next]
  }

  /**
   * Returns the list of Safe owner accounts.
   * @returns Array[Array[owners]]
   */
  getOwners: SafeContract_v1_4_1_Function<'getOwners'> = async () => {
    return [await this.contract.methods.getOwners().call()]
  }

  /**
   * Reads `length` bytes of storage in the currents contract
   * @param args - Array[offset, length]
   * @returns Array[storage]
   */
  getStorageAt: SafeContract_v1_4_1_Function<'getStorageAt'> = async (args) => {
    return [await this.contract.methods.getStorageAt(...args).call()]
  }

  /**
   * Returns the Safe threshold.
   * @returns Array[threshold]
   */
  getThreshold: SafeContract_v1_4_1_Function<'getThreshold'> = async () => {
    return [await this.contract.methods.getThreshold().call()]
  }

  /**
   * Returns hash to be signed by owners.
   * @param args - Array[to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce]
   * @returns Array[transactionHash]
   */
  getTransactionHash: SafeContract_v1_4_1_Function<'getTransactionHash'> = async (args) => {
    return [await this.contract.methods.getTransactionHash(...args).call()]
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   * @param args - Array[moduleAddress]
   * @returns Array[isEnabled]
   */
  isModuleEnabled: SafeContract_v1_4_1_Function<'isModuleEnabled'> = async (args) => {
    return [await this.contract.methods.isModuleEnabled(...args).call()]
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   * @param args - Array[address]
   * @returns Array[isOwner]
   */
  isOwner: SafeContract_v1_4_1_Function<'isOwner'> = async (args) => {
    return [await this.contract.methods.isOwner(...args).call()]
  }

  /**
   * Returns the Safe nonce.
   * @returns Array[nonce]
   */
  nonce: SafeContract_v1_4_1_Function<'nonce'> = async () => {
    return [await this.contract.methods.nonce().call()]
  }

  /**
   * @param args - Array[messageHash]
   * @returns Array[signedMessages]
   */
  signedMessages: SafeContract_v1_4_1_Function<'signedMessages'> = async (args) => {
    return [await this.contract.methods.signedMessages(...args).call()]
  }

  /**
   * Checks whether a given Safe transaction can be executed successfully with no errors.
   * @param safeTransaction - The Safe transaction to check.
   * @param options - Optional transaction options.
   * @returns True, if the given transactions is valid.
   */
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<boolean> {
    let isTxValid = false
    try {
      if (options && !options.gas) {
        options.gas = (
          await this.estimateGas(
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
          )
        ).toString()
      }
      isTxValid = await this.contract.methods
        .execTransaction(
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
        )
        .call(options)
    } catch {}
    return isTxValid
  }

  /**
   * Executes a transaction.
   * @param safeTransaction - The Safe transaction to execute.
   * @param options - Transaction options.
   * @returns Transaction result.
   */
  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (
        await this.estimateGas(
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
        )
      ).toString()
    }
    const txResponse = this.contract.methods
      .execTransaction(
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
      )
      .send(options)

    return toTxResult(txResponse, options)
  }

  /**
   * Returns array of first 10 modules.
   * @returns Array[modules]
   */
  async getModules(): Promise<readonly string[]> {
    const [modules] = await this.getModulesPaginated([SENTINEL_ADDRESS, BigInt(10)])
    return modules
  }

  /**
   * Marks a hash as approved. This can be used to validate a hash that is used by a signature.
   * @param hash - The hash that should be marked as approved for signatures that are verified by this contract.
   * @param options - Optional transaction options.
   * @returns Transaction result.
   */
  async approveHash(
    hash: string,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('approveHash', [hash], { ...options })).toString()
    }
    const txResponse = this.contract.methods.approveHash(hash).send(options)
    return toTxResult(txResponse, options)
  }

  /**
   * Returns the chain id of the Safe contract. (Custom method - not defined in the Safe Contract)
   * @returns Array[chainId]
   */
  async getChainId(): Promise<[bigint]> {
    return [await this.contract.methods.getChainId().call()]
  }

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract,

      setup: (): any => {
        // setup function is labelled as `external` on the contract code, but not present on type SafeContract_v1_4_1_Contract
        return
      },

      approveHash: this.approveHash.bind(this),

      isValidTransaction: this.isValidTransaction.bind(this),

      execTransaction: this.execTransaction.bind(this),

      getAddress: this.getAddress.bind(this),

      getModules: this.getModules.bind(this),

      isModuleEnabled: async (moduleAddress: string) =>
        (await this.isModuleEnabled([moduleAddress]))[0],

      getVersion: async () => (await this.VERSION())[0] as SafeVersion,

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

      encode: this.encode.bind(this),

      estimateGas: this.estimateGas.bind(this)
    }
  }
}

export default SafeContract_v1_4_1_Web3
