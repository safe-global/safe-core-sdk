import { Provider } from '@ethersproject/providers'
import { BigNumber, ContractTransaction, Signer } from 'ethers'
import SafeAbi from './abis/SafeAbiV1-2-0.json'
import ModuleManager from './managers/moduleManager'
import OwnerManager from './managers/ownerManager'
import Safe from './Safe'
import { sameString } from './utils'
import { generatePreValidatedSignature } from './utils/signatures'
import { EthSignSignature, SafeSignature } from './utils/signatures/SafeSignature'
import { estimateGasForTransactionExecution } from './utils/transactions/gas'
import SafeTransaction, { SafeTransactionDataPartial } from './utils/transactions/SafeTransaction'
import { standardizeSafeTransaction } from './utils/transactions/utils'

class EthersSafe implements Safe {
  #contract: any
  #ethers: any
  #ownerManager!: OwnerManager
  #moduleManager!: ModuleManager
  #provider!: Provider
  #signer?: Signer

  /**
   * Creates an instance of the Safe Core SDK.
   *
   * @param ethers - Ethers v5 library
   * @param safeAddress - The address of the Safe account to use
   * @param providerOrSigner - Ethers provider or signer. If this parameter is not passed, Ethers defaultProvider will be used.
   * @returns The Safe Core SDK instance
   */
  static async create(
    ethers: any,
    safeAddress: string,
    providerOrSigner?: Provider | Signer
  ): Promise<EthersSafe> {
    const safeSdk = new EthersSafe()
    await safeSdk.init(ethers, safeAddress, providerOrSigner)
    return safeSdk
  }

  /**
   * Initializes the Safe Core SDK instance.
   *
   * @param ethers - Ethers v5 library
   * @param safeAddress - The address of the Safe account to use
   * @param providerOrSigner - Ethers provider or signer. If this parameter is not passed, Ethers defaultProvider will be used.
   * @throws "Signer must be connected to a provider"
   * @throws "Safe contract is not deployed in the current network"
   */
  private async init(
    ethers: any,
    safeAddress: string,
    providerOrSigner?: Provider | Signer
  ): Promise<void> {
    const currentProviderOrSigner = providerOrSigner || (ethers.getDefaultProvider() as Provider)
    if (Signer.isSigner(currentProviderOrSigner)) {
      if (!currentProviderOrSigner.provider) {
        throw new Error('Signer must be connected to a provider')
      }
      this.#provider = currentProviderOrSigner.provider
      this.#signer = currentProviderOrSigner
    } else {
      this.#provider = currentProviderOrSigner
      this.#signer = undefined
    }
    const contractCode = await this.#provider.getCode(safeAddress)
    if (contractCode === '0x') {
      throw new Error('Safe contract is not deployed in the current network')
    }
    this.#ethers = ethers
    this.#contract = new this.#ethers.Contract(safeAddress, SafeAbi, currentProviderOrSigner)
    this.#ownerManager = new OwnerManager(this.#ethers, this.#contract)
    this.#moduleManager = new ModuleManager(this.#ethers, this.#contract)
  }

  /**
   * Returns a new instance of the Safe Core SDK connecting the providerOrSigner and the safeAddress.
   *
   * @param providerOrSigner - Ethers provider or signer
   * @param safeAddress - The address of the Safe account to use
   */
  async connect(providerOrSigner: Provider | Signer, safeAddress?: string): Promise<EthersSafe> {
    return await EthersSafe.create(
      this.#ethers,
      safeAddress || this.#contract.address,
      providerOrSigner
    )
  }

  /**
   * Returns the connected provider.
   *
   * @returns The connected provider
   */
  getProvider(): Provider {
    return this.#provider
  }

  /**
   * Returns the connected signer.
   *
   * @returns The connected signer
   */
  getSigner(): Signer | undefined {
    return this.#signer
  }

  /**
   * Returns the address of the current Safe Proxy contract.
   *
   * @returns The address of the Safe Proxy contract
   */
  getAddress(): string {
    return this.#contract.address
  }

  /**
   * Returns the Safe Master Copy contract version.
   *
   * @returns The Safe Master Copy contract version
   */
  async getContractVersion(): Promise<string> {
    return this.#contract.VERSION()
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
    return (await this.#contract.nonce()).toNumber()
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
    return (await this.#provider.getNetwork()).chainId
  }

  /**
   * Returns the ETH balance of the Safe.
   *
   * @returns The ETH balance of the Safe
   */
  async getBalance(): Promise<BigNumber> {
    return BigNumber.from(await this.#provider.getBalance(this.getAddress()))
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
   * @param safeTransaction - The minimum required data to create the transaction
   * @returns The Safe transaction
   */
  async createTransaction(tx: SafeTransactionDataPartial): Promise<SafeTransaction> {
    const safeTransaction = await standardizeSafeTransaction(this.#contract, tx)
    return new SafeTransaction(safeTransaction)
  }

  /**
   * Returns the transaction hash of a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction
   * @returns The transaction hash of the Safe transaction
   */
  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    const safeTransactionData = safeTransaction.data
    const txHash = await this.#contract.getTransactionHash(
      safeTransactionData.to,
      safeTransactionData.value,
      safeTransactionData.data,
      safeTransactionData.operation,
      safeTransactionData.safeTxGas,
      safeTransactionData.baseGas,
      safeTransactionData.gasPrice,
      safeTransactionData.gasToken,
      safeTransactionData.refundReceiver,
      safeTransactionData.nonce
    )
    return txHash
  }

  /**
   * Signs a hash using the current signer account.
   *
   * @param hash - The hash to sign
   * @returns The Safe signature
   * @throws "No signer provided"
   * @throws "Transactions can only be signed by Safe owners"
   */
  async signTransactionHash(hash: string): Promise<SafeSignature> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    const owners = await this.getOwners()
    const signerAddress = await this.#signer.getAddress()
    const addressIsOwner = owners.find(
      (owner: string) => this.#signer && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transactions can only be signed by Safe owners')
    }
    const messageArray = this.#ethers.utils.arrayify(hash)
    const signature = await this.#signer.signMessage(messageArray)
    return new EthSignSignature(signerAddress, signature)
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
   * @param skipOnChainApproval - TRUE to avoid the Safe transaction to be approved on-chain
   * @returns The pre-validated signature
   * @throws "No signer provided"
   * @throws "Transaction hashes can only be approved by Safe owners"
   */
  async approveTransactionHash(hash: string): Promise<ContractTransaction> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    const owners = await this.getOwners()
    const signerAddress = await this.#signer.getAddress()
    const addressIsOwner = owners.find(
      (owner: string) => this.#signer && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transaction hashes can only be approved by Safe owners')
    }
    return this.#contract.approveHash(hash)
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
      const approved = await this.#contract.approvedHashes(owner, txHash)
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
   */
  async getEnableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeEnableModuleData(moduleAddress),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to disable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @param params - Contract method name and specific parameters
   * @returns The Safe transaction ready to be signed
   */
  async getDisableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeDisableModuleData(moduleAddress),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to add an owner and optionally change the threshold.
   *
   * @param ownerAddress - The address of the new owner
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   */
  async getAddOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeAddOwnerWithThresholdData(ownerAddress, threshold),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to remove an owner and optionally change the threshold.
   *
   * @param ownerAddress - The address of the owner that will be removed
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   */
  async getRemoveOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeRemoveOwnerData(ownerAddress, threshold),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to replace an owner of the Safe with a new one.
   *
   * @param oldOwnerAddress - The old owner address
   * @param newOwnerAddress - The new owner address
   * @returns The Safe transaction ready to be signed
   */
  async getSwapOwnerTx(oldOwnerAddress: string, newOwnerAddress: string): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeSwapOwnerData(oldOwnerAddress, newOwnerAddress),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to change the threshold.
   *
   * @param threshold - The new threshold
   * @returns The Safe transaction ready to be signed
   */
  async getChangeThresholdTx(threshold: number): Promise<SafeTransaction> {
    const tx = await this.createTransaction({
      to: this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeChangeThresholdData(threshold),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Executes a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction to execute
   * @param options - Execution configuration options
   * @returns The Safe transaction response
   * @throws "No signer provided"
   * @throws "There are X signatures missing"
   */
  async executeTransaction(safeTransaction: SafeTransaction): Promise<ContractTransaction> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }

    const txHash = await this.getTransactionHash(safeTransaction)
    const ownersWhoApprovedTx = await this.getOwnersWhoApprovedTx(txHash)
    for (const owner of ownersWhoApprovedTx) {
      safeTransaction.addSignature(generatePreValidatedSignature(owner))
    }
    const owners = await this.getOwners()
    const signerAddress = await this.#signer.getAddress()
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
      this.#contract,
      await this.#signer.getAddress(),
      safeTransaction
    )
    const txResponse = await this.#contract.execTransaction(
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
      { gasLimit }
    )
    return txResponse
  }
}

export default EthersSafe
