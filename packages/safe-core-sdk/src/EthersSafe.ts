import EthAdapter from 'ethereumLibs/EthAdapter'
import { BigNumber } from 'ethers'
import ContractManager from './managers/contractManager'
import ModuleManager from './managers/moduleManager'
import OwnerManager from './managers/ownerManager'
import Safe, { ConnectEthersSafeConfig, EthersSafeConfig } from './Safe'
import { sameString } from './utils'
import { generatePreValidatedSignature, generateSignature } from './utils/signatures'
import { SafeSignature } from './utils/signatures/SafeSignature'
import { estimateGasForTransactionExecution } from './utils/transactions/gas'
import SafeTransaction, {
  OperationType,
  SafeTransactionDataPartial
} from './utils/transactions/SafeTransaction'
import { TransactionResult } from './utils/transactions/types'
import {
  encodeMultiSendData,
  standardizeMetaTransactionData,
  standardizeSafeTransactionData
} from './utils/transactions/utils'

class EthersSafe implements Safe {
  #ethAdapter!: EthAdapter
  #contractManager!: ContractManager
  #ownerManager!: OwnerManager
  #moduleManager!: ModuleManager

  /**
   * Creates an instance of the Safe Core SDK.
   * @param config - Ethers Safe configuration
   * @returns The Safe Core SDK instance
   * @throws "Safe contracts not found in the current network"
   * @throws "Safe Proxy contract is not deployed in the current network"
   * @throws "MultiSend contract is not deployed in the current network"
   */
  static async create({
    ethAdapter,
    safeAddress,
    contractNetworks
  }: EthersSafeConfig): Promise<EthersSafe> {
    const safeSdk = new EthersSafe()
    await safeSdk.init({ ethAdapter, safeAddress, contractNetworks })
    return safeSdk
  }

  /**
   * Initializes the Safe Core SDK instance.
   * @param config - Ethers Safe configuration
   * @throws "Signer must be connected to a provider"
   * @throws "Safe contracts not found in the current network"
   * @throws "Safe Proxy contract is not deployed in the current network"
   * @throws "MultiSend contract is not deployed in the current network"
   */
  private async init({
    ethAdapter,
    safeAddress,
    contractNetworks
  }: EthersSafeConfig): Promise<void> {
    this.#ethAdapter = ethAdapter
    this.#contractManager = await ContractManager.create(
      this.#ethAdapter,
      safeAddress,
      contractNetworks
    )
    this.#ownerManager = new OwnerManager(this.#ethAdapter, this.#contractManager.safeContract)
    this.#moduleManager = new ModuleManager(this.#ethAdapter, this.#contractManager.safeContract)
  }

  /**
   * Returns a new instance of the Safe Core SDK.
   * @param config - Connect Ethers Safe configuration
   * @throws "Safe contracts not found in the current network"
   * @throws "Safe Proxy contract is not deployed in the current network"
   * @throws "MultiSend contract is not deployed in the current network"
   */
  async connect({
    ethAdapter,
    safeAddress,
    contractNetworks
  }: ConnectEthersSafeConfig): Promise<EthersSafe> {
    return await EthersSafe.create({
      ethAdapter: ethAdapter || this.#ethAdapter,
      safeAddress: safeAddress || this.getAddress(),
      contractNetworks: contractNetworks || this.#contractManager.contractNetworks
    })
  }

  /**
   * Returns the address of the current Safe Proxy contract.
   *
   * @returns The address of the Safe Proxy contract
   */
  getAddress(): string {
    return this.#contractManager.safeContract.getAddress()
  }

  /**
   * Returns the current EthAdapter.
   *
   * @returns The current EthAdapter
   */
  getEthAdapter(): EthAdapter {
    return this.#ethAdapter
  }

  /**
   * Returns the address of the MultiSend contract.
   *
   * @returns The address of the MultiSend contract
   */
  getMultiSendAddress(): string {
    return this.#contractManager.multiSendContract.getAddress()
  }

  /**
   * Returns the Safe Master Copy contract version.
   *
   * @returns The Safe Master Copy contract version
   */
  async getContractVersion(): Promise<string> {
    return this.#contractManager.safeContract.getVersion()
  }

  /**
   * Returns the list of Safe owner accounts.
   *
   * @returns The list of owners
   */
  async getOwners(): Promise<string[]> {
    return this.#ownerManager.getOwners()
  }

  /**
   * Returns the Safe nonce.
   *
   * @returns The Safe nonce
   */
  async getNonce(): Promise<number> {
    return this.#contractManager.safeContract.getNonce()
  }

  /**
   * Returns the Safe threshold.
   *
   * @returns The Safe threshold
   */
  async getThreshold(): Promise<number> {
    return this.#ownerManager.getThreshold()
  }

  /**
   * Returns the chainId of the connected network.
   *
   * @returns The chainId of the connected network
   */
  async getChainId(): Promise<number> {
    return this.#ethAdapter.getChainId()
  }

  /**
   * Returns the ETH balance of the Safe.
   *
   * @returns The ETH balance of the Safe
   */
  async getBalance(): Promise<BigNumber> {
    return this.#ethAdapter.getBalance(this.getAddress())
  }

  /**
   * Returns the list of addresses of all the enabled Safe modules.
   *
   * @returns The list of addresses of all the enabled Safe modules
   */
  async getModules(): Promise<string[]> {
    return this.#moduleManager.getModules()
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   *
   * @param moduleAddress - The desired module address
   * @returns TRUE if the module is enabled
   */
  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.#moduleManager.isModuleEnabled(moduleAddress)
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   *
   * @param ownerAddress - The account address
   * @returns TRUE if the account is an owner
   */
  async isOwner(ownerAddress: string): Promise<boolean> {
    return this.#ownerManager.isOwner(ownerAddress)
  }

  /**
   * Returns a Safe transaction ready to be signed by the owners.
   *
   * @param safeTransactions - The list of transactions to process
   * @returns The Safe transaction
   */
  async createTransaction(
    ...safeTransactions: SafeTransactionDataPartial[]
  ): Promise<SafeTransaction> {
    if (safeTransactions.length === 1) {
      const standardizedTransaction = await standardizeSafeTransactionData(
        this.#contractManager.safeContract,
        this.#ethAdapter,
        safeTransactions[0]
      )
      return new SafeTransaction(standardizedTransaction)
    }
    const multiSendData = encodeMultiSendData(safeTransactions.map(standardizeMetaTransactionData))
    const multiSendTransaction = {
      to: this.#contractManager.multiSendContract.getAddress(),
      value: '0',
      data: this.#contractManager.multiSendContract.encode('multiSend', [multiSendData]),
      operation: OperationType.DelegateCall
    }
    const standardizedTransaction = await standardizeSafeTransactionData(
      this.#contractManager.safeContract,
      this.#ethAdapter,
      multiSendTransaction
    )
    return new SafeTransaction(standardizedTransaction)
  }

  /**
   * Returns the transaction hash of a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction
   * @returns The transaction hash of the Safe transaction
   */
  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    const safeTransactionData = safeTransaction.data
    const txHash = await this.#contractManager.safeContract.getTransactionHash(safeTransactionData)
    return txHash
  }

  /**
   * Signs a hash using the current signer account.
   *
   * @param hash - The hash to sign
   * @returns The Safe signature
   * @throws "Transactions can only be signed by Safe owners"
   */
  async signTransactionHash(hash: string): Promise<SafeSignature> {
    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    console.log(owners, signerAddress)
    const addressIsOwner = owners.find(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transactions can only be signed by Safe owners')
    }
    return generateSignature(this.#ethAdapter, hash)
  }

  /**
   * Adds the signature of the current signer to the Safe transaction object.
   *
   * @param safeTransaction - The Safe transaction to be signed
   */
  async signTransaction(safeTransaction: SafeTransaction): Promise<void> {
    const txHash = await this.getTransactionHash(safeTransaction)
    const signature = await this.signTransactionHash(txHash)
    safeTransaction.addSignature(signature)
  }

  /**
   * Approves on-chain a hash using the current signer account.
   *
   * @param hash - The hash to approve
   * @returns The Safe transaction response
   * @throws "Transaction hashes can only be approved by Safe owners"
   */
  async approveTransactionHash(hash: string): Promise<TransactionResult> {
    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    const addressIsOwner = owners.find(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transaction hashes can only be approved by Safe owners')
    }
    return this.#contractManager.safeContract.approveHash(hash)
  }

  /**
   * Returns a list of owners who have approved a specific Safe transaction.
   *
   * @param txHash - The Safe transaction hash
   * @returns The list of owners
   */
  async getOwnersWhoApprovedTx(txHash: string): Promise<string[]> {
    const owners = await this.getOwners()
    let ownersWhoApproved: string[] = []
    for (const owner of owners) {
      const approved = await this.#contractManager.safeContract.approvedHashes(owner, txHash)
      if (approved.gt(0)) {
        ownersWhoApproved.push(owner)
      }
    }
    return ownersWhoApproved
  }

  /**
   * Returns the Safe transaction to enable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid module address provided"
   * @throws "Module provided is already enabled"
   */
  async getEnableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeEnableModuleData(moduleAddress)
    })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to disable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid module address provided"
   * @throws "Module provided is not enabled already"
   */
  async getDisableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeDisableModuleData(moduleAddress)
    })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to add an owner and optionally change the threshold.
   *
   * @param ownerAddress - The address of the new owner
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid owner address provided"
   * @throws "Address provided is already an owner"
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async getAddOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeAddOwnerWithThresholdData(ownerAddress, threshold)
    })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to remove an owner and optionally change the threshold.
   *
   * @param ownerAddress - The address of the owner that will be removed
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid owner address provided"
   * @throws "Address provided is not an owner"
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async getRemoveOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeRemoveOwnerData(ownerAddress, threshold)
    })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to replace an owner of the Safe with a new one.
   *
   * @param oldOwnerAddress - The old owner address
   * @param newOwnerAddress - The new owner address
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid new owner address provided"
   * @throws "Invalid old owner address provided"
   * @throws "New address provided is already an owner"
   * @throws "Old address provided is not an owner"
   */
  async getSwapOwnerTx(oldOwnerAddress: string, newOwnerAddress: string): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeSwapOwnerData(oldOwnerAddress, newOwnerAddress)
    })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to change the threshold.
   *
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async getChangeThresholdTx(threshold: number): Promise<SafeTransaction> {
    const safeTransaction = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeChangeThresholdData(threshold)
    })
    return safeTransaction
  }

  /**
   * Executes a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction to execute
   * @returns The Safe transaction response
   * @throws "There are X signatures missing"
   */
  async executeTransaction(safeTransaction: SafeTransaction): Promise<TransactionResult> {
    const txHash = await this.getTransactionHash(safeTransaction)
    const ownersWhoApprovedTx = await this.getOwnersWhoApprovedTx(txHash)
    for (const owner of ownersWhoApprovedTx) {
      safeTransaction.addSignature(generatePreValidatedSignature(owner))
    }
    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (owners.includes(signerAddress)) {
      safeTransaction.addSignature(generatePreValidatedSignature(signerAddress))
    }

    const threshold = await this.getThreshold()
    if (threshold > safeTransaction.signatures.size) {
      const signaturesMissing = threshold - safeTransaction.signatures.size
      throw new Error(
        `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${
          signaturesMissing > 1 ? 's' : ''
        } missing`
      )
    }
    const gasLimit = await estimateGasForTransactionExecution(
      this.#contractManager.safeContract,
      signerAddress,
      safeTransaction
    )
    const txResponse = await this.#contractManager.safeContract.execTransaction(safeTransaction, {
      from: await this.#ethAdapter.getSignerAddress(),
      gasLimit
    })
    return txResponse
  }
}

export default EthersSafe
