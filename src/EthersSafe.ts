import { Provider } from '@ethersproject/providers'
import { BigNumber, ContractTransaction, Wallet } from 'ethers'
import { GnosisSafe } from '../typechain'
import SafeAbi from './abis/SafeAbiV1-2-0.json'
import Safe from './Safe'
import { areAddressesEqual } from './utils'
import { SENTINEL_MODULES, SENTINEL_OWNERS, zeroAddress } from './utils/constants'
import { generatePreValidatedSignature } from './utils/signatures'
import { EthSignSignature, SafeSignature } from './utils/signatures/SafeSignature'
import { SafeTransaction } from './utils/transactions'

class EthersSafe implements Safe {
  #contract: GnosisSafe
  #ethers: any
  #provider: Provider
  #signer?: Wallet

  /**
   * Creates an instance of the Safe Core SDK.
   *
   * @param ethers - Ethers v5 library
   * @param safeAddress - The address of the Safe account to use
   * @param providerOrSigner - Ethers provider or signer. If this parameter is not passed, Ethers defaultProvider will be used.
   * @returns The Safe Core SDK instance
   */
  constructor(ethers: any, safeAddress: string, providerOrSigner?: Provider | Wallet) {
    const currentProviderOrSigner = providerOrSigner || (ethers.getDefaultProvider() as Provider)
    this.#ethers = ethers
    this.#contract = new this.#ethers.Contract(safeAddress, SafeAbi, currentProviderOrSigner)
    if (Wallet.isSigner(currentProviderOrSigner)) {
      this.#signer = currentProviderOrSigner
      this.#provider = currentProviderOrSigner.provider
      return
    }
    this.#signer = undefined
    this.#provider = currentProviderOrSigner
  }

  /**
   * Initializes the Safe Core SDK connecting the providerOrSigner to the safeAddress.
   *
   * @param providerOrSigner - Ethers provider or signer
   * @param safeAddress - The address of the Safe account to use
   */
  connect(providerOrSigner: Provider | Wallet, safeAddress?: string): EthersSafe {
    return new EthersSafe(this.#ethers, safeAddress || this.#contract.address, providerOrSigner)
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
  getSigner(): Wallet | undefined {
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
    return this.#contract.getOwners()
  }

  /**
   * Returns the Safe threshold.
   *
   * @returns The Safe threshold
   */
  async getThreshold(): Promise<number> {
    return (await this.#contract.getThreshold()).toNumber()
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
    return this.#contract.getModules()
  }

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   *
   * @param moduleAddress - The desired module address
   * @returns TRUE if the module is enabled
   */
  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.#contract.isModuleEnabled(moduleAddress)
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   *
   * @param ownerAddress - The account address
   * @returns TRUE if the account is an owner
   */
  async isOwner(ownerAddress: string): Promise<boolean> {
    const isOwner = await this.#contract.isOwner(ownerAddress)
    return isOwner
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
   */
  async signTransactionHash(hash: string): Promise<SafeSignature> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    const owners = await this.getOwners()
    const addressIsOwner = owners.find(
      (owner: string) => this.#signer && areAddressesEqual(owner, this.#signer.address)
    )
    if (!addressIsOwner) {
      throw new Error('Transactions can only be signed by Safe owners')
    }
    const messageArray = this.#ethers.utils.arrayify(hash)
    const signature = await this.#signer.signMessage(messageArray)
    return new EthSignSignature(this.#signer.address, signature)
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
   */
  async approveTransactionHash(
    hash: string,
    skipOnChainApproval?: boolean
  ): Promise<SafeSignature> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    const owners = await this.getOwners()
    const addressIsOwner = owners.find(
      (owner: string) => this.#signer && areAddressesEqual(owner, this.#signer.address)
    )
    if (!addressIsOwner) {
      throw new Error('Transaction hashes can only be approved by Safe owners')
    }
    if (!skipOnChainApproval) {
      await this.#contract.approveHash(hash)
    }
    return generatePreValidatedSignature(this.#signer.address)
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
   * Executes a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction to execute
   * @param options - Execution configuration options
   * @returns The Safe transaction response
   */
  async executeTransaction(
    safeTransaction: SafeTransaction,
    options?: any
  ): Promise<ContractTransaction> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }

    const txHash = await this.getTransactionHash(safeTransaction)
    const ownersWhoApprovedTx = await this.getOwnersWhoApprovedTx(txHash)
    for (const owner of ownersWhoApprovedTx) {
      safeTransaction.addSignature(generatePreValidatedSignature(owner))
    }
    const owners = await this.getOwners()
    if (owners.includes(this.#signer.address)) {
      safeTransaction.addSignature(generatePreValidatedSignature(this.#signer.address))
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
      { ...options }
    )
    return txResponse
  }

  /**
   * Returns the Safe transaction to enable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @returns The Safe transaction ready to be signed
   */
  async getEnableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const isValidAddress = this.#ethers.utils.isAddress(moduleAddress)
    if (!isValidAddress || moduleAddress === zeroAddress || moduleAddress === SENTINEL_MODULES) {
      throw new Error('Invalid module address provided')
    }
    const modules = await this.getModules()
    const moduleIndex = modules.findIndex((module: string) =>
      areAddressesEqual(module, moduleAddress)
    )
    if (moduleIndex >= 0) {
      throw new Error('Module provided is already enabled')
    }
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('enableModule', [moduleAddress]),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }

  /**
   * Returns the Safe transaction to disable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @returns The Safe transaction ready to be signed
   */
  async getDisableModuleTx(moduleAddress: string): Promise<SafeTransaction> {
    const isValidAddress = this.#ethers.utils.isAddress(moduleAddress)
    if (!isValidAddress || moduleAddress === zeroAddress || moduleAddress === SENTINEL_MODULES) {
      throw new Error('Invalid module address provided')
    }
    const modules = await this.getModules()
    const moduleIndex = modules.findIndex((module: string) =>
      areAddressesEqual(module, moduleAddress)
    )
    if (moduleIndex < 0) {
      throw new Error('Module provided is not enabled already')
    }
    const prevModuleAddress = moduleIndex === 0 ? SENTINEL_MODULES : modules[moduleIndex - 1]
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('disableModule', [
        prevModuleAddress,
        moduleAddress
      ]),
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
    const isValidAddress = this.#ethers.utils.isAddress(ownerAddress)
    if (!isValidAddress || ownerAddress === zeroAddress || ownerAddress === SENTINEL_OWNERS) {
      throw new Error('Invalid owner address provided')
    }
    const owners = await this.getOwners()
    const addressIsOwner = owners.find((owner: string) => areAddressesEqual(owner, ownerAddress))
    if (addressIsOwner) {
      throw new Error('Address provided is already an owner')
    }
    const newThreshold = threshold ?? (await this.getThreshold())
    if (newThreshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (newThreshold > owners.length + 1) {
      throw new Error('Threshold cannot exceed owner count')
    }
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('addOwnerWithThreshold', [
        ownerAddress,
        newThreshold
      ]),
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
    const isValidAddress = this.#ethers.utils.isAddress(ownerAddress)
    if (!isValidAddress || ownerAddress === zeroAddress || ownerAddress === SENTINEL_OWNERS) {
      throw new Error('Invalid owner address provided')
    }
    const owners = await this.getOwners()
    const ownerIndex = owners.findIndex((owner: string) => areAddressesEqual(owner, ownerAddress))
    const isOwner = ownerIndex >= 0
    if (!isOwner) {
      throw new Error('Address provided is not an owner')
    }
    const newThreshold = threshold ?? (await this.getThreshold()) - 1
    if (newThreshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (newThreshold > owners.length - 1) {
      throw new Error('Threshold cannot exceed owner count')
    }
    const prevOwnerAddress = ownerIndex === 0 ? SENTINEL_OWNERS : owners[ownerIndex - 1]
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('removeOwner', [
        prevOwnerAddress,
        ownerAddress,
        newThreshold
      ]),
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
    const isValidOldAddress = this.#ethers.utils.isAddress(oldOwnerAddress)
    const isValidNewAddress = this.#ethers.utils.isAddress(newOwnerAddress)
    if (
      !isValidOldAddress ||
      oldOwnerAddress === zeroAddress ||
      oldOwnerAddress === SENTINEL_OWNERS
    ) {
      throw new Error('Invalid old owner address provided')
    }
    if (
      !isValidNewAddress ||
      newOwnerAddress === zeroAddress ||
      newOwnerAddress === SENTINEL_OWNERS
    ) {
      throw new Error('Invalid new owner address provided')
    }
    const owners = await this.getOwners()
    const isOwnerNewAddress = owners.find((owner: string) =>
      areAddressesEqual(owner, newOwnerAddress)
    )
    if (isOwnerNewAddress) {
      throw new Error('New address provided is already an owner')
    }
    const ownerIndex = owners.findIndex((owner: string) =>
      areAddressesEqual(owner, oldOwnerAddress)
    )
    const isOwner = ownerIndex >= 0
    if (!isOwner) {
      throw new Error('Old address provided is not an owner')
    }
    const prevOwnerAddress = ownerIndex === 0 ? SENTINEL_OWNERS : owners[ownerIndex - 1]
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('swapOwner', [
        prevOwnerAddress,
        oldOwnerAddress,
        newOwnerAddress
      ]),
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
    if (threshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    const owners = await this.getOwners()
    if (threshold > owners.length) {
      throw new Error('Threshold cannot exceed owner count')
    }
    const tx = new SafeTransaction({
      to: this.getAddress(),
      value: '0',
      data: this.#contract.interface.encodeFunctionData('changeThreshold', [threshold]),
      nonce: (await this.#contract.nonce()).toNumber()
    })
    return tx
  }
}

export default EthersSafe
