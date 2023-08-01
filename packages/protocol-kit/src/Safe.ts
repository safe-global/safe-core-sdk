import { BigNumber } from '@ethersproject/bignumber'
import {
  EthAdapter,
  OperationType,
  SafeMultisigTransactionResponse,
  SafeSignature,
  SafeTransaction,
  SafeTransactionDataPartial,
  SafeTransactionEIP712Args,
  SafeVersion,
  TransactionOptions,
  TransactionResult,
  MetaTransactionData,
  Transaction
} from '@safe-global/safe-core-sdk-types'
import {
  PREDETERMINED_SALT_NONCE,
  encodeSetupCallData,
  predictSafeAddress
} from './contracts/utils'
import { DEFAULT_SAFE_VERSION } from './contracts/config'
import ContractManager from './managers/contractManager'
import FallbackHandlerManager from './managers/fallbackHandlerManager'
import GuardManager from './managers/guardManager'
import ModuleManager from './managers/moduleManager'
import OwnerManager from './managers/ownerManager'
import {
  AddOwnerTxParams,
  ConnectSafeConfig,
  CreateTransactionProps,
  PredictedSafeProps,
  RemoveOwnerTxParams,
  SafeConfig,
  SafeConfigProps,
  SwapOwnerTxParams
} from './types'
import {
  EthSafeSignature,
  SAFE_FEATURES,
  hasSafeFeature,
  isMetaTransactionArray,
  isSafeMultisigTransactionResponse,
  sameString
} from './utils'
import {
  generateEIP712Signature,
  generatePreValidatedSignature,
  generateSignature
} from './utils/signatures/utils'
import EthSafeTransaction from './utils/transactions/SafeTransaction'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import {
  encodeMultiSendData,
  standardizeMetaTransactionData,
  standardizeSafeTransactionData
} from './utils/transactions/utils'
import { isSafeConfigWithPredictedSafe } from './utils/types'
import {
  getMultiSendCallOnlyContract,
  getProxyFactoryContract,
  getSafeContract
} from './contracts/safeDeploymentContracts'

class Safe {
  #predictedSafe?: PredictedSafeProps
  #ethAdapter!: EthAdapter
  #contractManager!: ContractManager
  #ownerManager!: OwnerManager
  #moduleManager!: ModuleManager
  #guardManager!: GuardManager
  #fallbackHandlerManager!: FallbackHandlerManager

  /**
   * Creates an instance of the Safe Core SDK.
   * @param config - Ethers Safe configuration
   * @returns The Safe Core SDK instance
   * @throws "The SDK must be initialized with a safeAddress or a predictedSafe"
   * @throws "SafeProxy contract is not deployed on the current network"
   * @throws "MultiSend contract is not deployed on the current network"
   * @throws "MultiSendCallOnly contract is not deployed on the current network"
   */
  static async create(config: SafeConfig): Promise<Safe> {
    const safeSdk = new Safe()
    await safeSdk.init(config)
    return safeSdk
  }

  /**
   * Initializes the Safe Core SDK instance.
   * @param config - Safe configuration
   * @throws "Signer must be connected to a provider"
   * @throws "SafeProxy contract is not deployed on the current network"
   * @throws "MultiSend contract is not deployed on the current network"
   * @throws "MultiSendCallOnly contract is not deployed on the current network"
   */
  private async init(config: SafeConfig): Promise<void> {
    const { ethAdapter, isL1SafeMasterCopy, contractNetworks } = config

    this.#ethAdapter = ethAdapter

    if (isSafeConfigWithPredictedSafe(config)) {
      this.#predictedSafe = config.predictedSafe
      this.#contractManager = await ContractManager.create({
        ethAdapter: this.#ethAdapter,
        predictedSafe: this.#predictedSafe,
        isL1SafeMasterCopy,
        contractNetworks
      })
    } else {
      this.#contractManager = await ContractManager.create({
        ethAdapter: this.#ethAdapter,
        safeAddress: config.safeAddress,
        isL1SafeMasterCopy,
        contractNetworks
      })
    }

    this.#ownerManager = new OwnerManager(this.#ethAdapter, this.#contractManager.safeContract)
    this.#moduleManager = new ModuleManager(this.#ethAdapter, this.#contractManager.safeContract)
    this.#guardManager = new GuardManager(this.#ethAdapter, this.#contractManager.safeContract)
    this.#fallbackHandlerManager = new FallbackHandlerManager(
      this.#ethAdapter,
      this.#contractManager.safeContract
    )
  }

  /**
   * Returns a new instance of the Safe Core SDK.
   * @param config - Connect Safe configuration
   * @throws "A safeAddress and a predictedSafe cannot be connected at the same time"
   * @throws "SafeProxy contract is not deployed on the current network"
   * @throws "MultiSend contract is not deployed on the current network"
   * @throws "MultiSendCallOnly contract is not deployed on the current network"
   */
  async connect(config: ConnectSafeConfig): Promise<Safe> {
    const { ethAdapter, safeAddress, predictedSafe, isL1SafeMasterCopy, contractNetworks } = config
    const configProps: SafeConfigProps = {
      ethAdapter: ethAdapter || this.#ethAdapter,
      isL1SafeMasterCopy: isL1SafeMasterCopy || this.#contractManager.isL1SafeMasterCopy,
      contractNetworks: contractNetworks || this.#contractManager.contractNetworks
    }

    // A new existing Safe is connected to the Signer
    if (safeAddress) {
      return await Safe.create({
        safeAddress,
        ...configProps
      })
    }

    // A new predicted Safe is connected to the Signer
    if (predictedSafe) {
      return await Safe.create({
        predictedSafe,
        ...configProps
      })
    }

    // The previous predicted Safe is connected to a new Signer
    if (this.#predictedSafe) {
      return await Safe.create({
        predictedSafe: this.#predictedSafe,
        ...configProps
      })
    }

    // The previous existing Safe is connected to a new Signer
    return await Safe.create({
      safeAddress: await this.getAddress(),
      ...configProps
    })
  }

  /**
   * Returns the address of the current SafeProxy contract.
   *
   * @returns The address of the SafeProxy contract
   */
  async getAddress(): Promise<string> {
    if (this.#predictedSafe) {
      const safeVersion = await this.getContractVersion()
      if (!hasSafeFeature(SAFE_FEATURES.ACCOUNT_ABSTRACTION, safeVersion)) {
        throw new Error(
          'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
        )
      }

      const chainId = await this.#ethAdapter.getChainId()
      return predictSafeAddress({
        ethAdapter: this.#ethAdapter,
        customContracts: this.#contractManager.contractNetworks?.[chainId],
        ...this.#predictedSafe
      })
    }

    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }

    return Promise.resolve(this.#contractManager.safeContract.getAddress())
  }

  /**
   * Returns the ContractManager
   *
   * @returns The current ContractManager
   * */
  getContractManager(): ContractManager {
    return this.#contractManager
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
   * Returns the address of the MultiSendCallOnly contract.
   *
   * @returns The address of the MultiSendCallOnly contract
   */
  getMultiSendCallOnlyAddress(): string {
    return this.#contractManager.multiSendCallOnlyContract.getAddress()
  }

  /**
   * Checks if the current Safe is deployed.
   *
   * @returns TRUE if the Safe contract is deployed
   */
  async isSafeDeployed(): Promise<boolean> {
    const safeAddress = await this.getAddress()
    const isSafeDeployed = await this.#ethAdapter.isContractDeployed(safeAddress)
    return isSafeDeployed
  }

  /**
   * Returns the Safe Master Copy contract version.
   *
   * @returns The Safe Master Copy contract version
   */
  async getContractVersion(): Promise<SafeVersion> {
    if (this.#contractManager.safeContract) {
      return this.#contractManager.safeContract.getVersion()
    }

    if (this.#predictedSafe?.safeDeploymentConfig?.safeVersion) {
      return Promise.resolve(this.#predictedSafe.safeDeploymentConfig.safeVersion)
    }

    return Promise.resolve(DEFAULT_SAFE_VERSION)
  }

  /**
   * Returns the list of Safe owner accounts.
   *
   * @returns The list of owners
   */
  async getOwners(): Promise<string[]> {
    if (this.#predictedSafe?.safeAccountConfig.owners) {
      return Promise.resolve(this.#predictedSafe.safeAccountConfig.owners)
    }

    return this.#ownerManager.getOwners()
  }

  /**
   * Returns the Safe nonce.
   *
   * @returns The Safe nonce
   */
  async getNonce(): Promise<number> {
    if (!this.#contractManager.safeContract) {
      return Promise.resolve(0)
    }

    return this.#contractManager.safeContract.getNonce()
  }

  /**
   * Returns the Safe threshold.
   *
   * @returns The Safe threshold
   */
  async getThreshold(): Promise<number> {
    if (this.#predictedSafe?.safeAccountConfig.threshold) {
      return Promise.resolve(this.#predictedSafe.safeAccountConfig.threshold)
    }

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
    return this.#ethAdapter.getBalance(await this.getAddress())
  }

  /**
   * Returns the address of the FallbackHandler contract.
   *
   * @returns The address of the FallbackHandler contract
   */
  getFallbackHandler(): Promise<string> {
    return this.#fallbackHandlerManager.getFallbackHandler()
  }

  /**
   * Returns the enabled Safe guard or 0x address if no guards are enabled.
   *
   * @returns The address of the enabled Safe guard
   * @throws "Current version of the Safe does not support Safe transaction guards functionality"
   */
  async getGuard(): Promise<string> {
    return this.#guardManager.getGuard()
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
    if (this.#predictedSafe?.safeAccountConfig.owners) {
      return Promise.resolve(
        this.#predictedSafe?.safeAccountConfig.owners.some((owner: string) =>
          sameString(owner, ownerAddress)
        )
      )
    }

    return this.#ownerManager.isOwner(ownerAddress)
  }

  /**
   * Returns a Safe transaction ready to be signed by the owners.
   *
   * @param createTransactionProps - The createTransaction props
   * @returns The Safe transaction
   * @throws "Invalid empty array of transactions"
   */
  async createTransaction({
    safeTransactionData,
    onlyCalls = false,
    options
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const safeVersion = await this.getContractVersion()
    if (this.#predictedSafe && !hasSafeFeature(SAFE_FEATURES.ACCOUNT_ABSTRACTION, safeVersion)) {
      throw new Error(
        'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
      )
    }

    if (isMetaTransactionArray(safeTransactionData) && safeTransactionData.length === 0) {
      throw new Error('Invalid empty array of transactions')
    }

    let newTransaction: SafeTransactionDataPartial
    if (isMetaTransactionArray(safeTransactionData) && safeTransactionData.length > 1) {
      const multiSendContract = onlyCalls
        ? this.#contractManager.multiSendCallOnlyContract
        : this.#contractManager.multiSendContract

      const multiSendData = encodeMultiSendData(
        safeTransactionData.map(standardizeMetaTransactionData)
      )

      const multiSendTransaction = {
        ...options,
        to: multiSendContract.getAddress(),
        value: '0',
        data: multiSendContract.encode('multiSend', [multiSendData]),
        operation: OperationType.DelegateCall
      }
      newTransaction = multiSendTransaction
    } else {
      newTransaction = isMetaTransactionArray(safeTransactionData)
        ? { ...options, ...safeTransactionData[0] }
        : safeTransactionData
    }

    if (this.#predictedSafe) {
      return new EthSafeTransaction(
        await standardizeSafeTransactionData({
          predictedSafe: this.#predictedSafe,
          ethAdapter: this.#ethAdapter,
          tx: newTransaction,
          contractNetworks: this.#contractManager.contractNetworks
        })
      )
    }

    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }
    return new EthSafeTransaction(
      await standardizeSafeTransactionData({
        safeContract: this.#contractManager.safeContract,
        ethAdapter: this.#ethAdapter,
        tx: newTransaction,
        contractNetworks: this.#contractManager.contractNetworks
      })
    )
  }

  /**
   * Returns a Safe transaction ready to be signed by the owners that invalidates the pending Safe transaction/s with a specific nonce.
   *
   * @param nonce - The nonce of the transaction/s that are going to be rejected
   * @returns The Safe transaction that invalidates the pending Safe transaction/s
   */
  async createRejectionTransaction(nonce: number): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      nonce,
      value: '0',
      data: '0x',
      safeTxGas: '0'
    }
    return this.createTransaction({ safeTransactionData })
  }

  /**
   * Copies a Safe transaction
   *
   * @param safeTransaction - The Safe transaction
   * @returns The new Safe transaction
   */
  async copyTransaction(safeTransaction: SafeTransaction): Promise<SafeTransaction> {
    const signedSafeTransaction = await this.createTransaction({
      safeTransactionData: safeTransaction.data
    })
    safeTransaction.signatures.forEach((signature) => {
      signedSafeTransaction.addSignature(signature)
    })
    return signedSafeTransaction
  }

  /**
   * Returns the transaction hash of a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction
   * @returns The transaction hash of the Safe transaction
   */
  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }
    const safeTransactionData = safeTransaction.data
    const txHash = await this.#contractManager.safeContract.getTransactionHash(safeTransactionData)
    return txHash
  }

  /**
   * Signs a hash using the current signer account.
   *
   * @param hash - The hash to sign
   * @returns The Safe signature
   */
  async signTransactionHash(hash: string): Promise<SafeSignature> {
    return generateSignature(this.#ethAdapter, hash)
  }

  /**
   * Signs a transaction according to the EIP-712 using the current signer account.
   *
   * @param safeTransaction - The Safe transaction to be signed
   * @param methodVersion - EIP-712 version. Optional
   * @returns The Safe signature
   */
  async signTypedData(
    safeTransaction: SafeTransaction,
    methodVersion?: 'v3' | 'v4'
  ): Promise<SafeSignature> {
    const safeTransactionEIP712Args: SafeTransactionEIP712Args = {
      safeAddress: await this.getAddress(),
      safeVersion: await this.getContractVersion(),
      chainId: await this.getEthAdapter().getChainId(),
      safeTransactionData: safeTransaction.data
    }
    return generateEIP712Signature(this.#ethAdapter, safeTransactionEIP712Args, methodVersion)
  }

  /**
   * Adds the signature of the current signer to the Safe transaction object.
   *
   * @param safeTransaction - The Safe transaction to be signed
   * @param signingMethod - Method followed to sign a transaction. Optional. Default value is "eth_sign"
   * @returns The signed Safe transaction
   * @throws "Transactions can only be signed by Safe owners"
   */
  async signTransaction(
    safeTransaction: SafeTransaction | SafeMultisigTransactionResponse,
    signingMethod:
      | 'eth_sign'
      | 'eth_signTypedData'
      | 'eth_signTypedData_v3'
      | 'eth_signTypedData_v4' = 'eth_signTypedData_v4'
  ): Promise<SafeTransaction> {
    const transaction = isSafeMultisigTransactionResponse(safeTransaction)
      ? await this.toSafeTransactionType(safeTransaction)
      : safeTransaction

    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transactions can only be signed by Safe owners')
    }

    let signature: SafeSignature
    if (signingMethod === 'eth_signTypedData_v4') {
      signature = await this.signTypedData(transaction, 'v4')
    } else if (signingMethod === 'eth_signTypedData_v3') {
      signature = await this.signTypedData(transaction, 'v3')
    } else if (signingMethod === 'eth_signTypedData') {
      signature = await this.signTypedData(transaction)
    } else {
      const safeVersion = await this.getContractVersion()
      if (!hasSafeFeature(SAFE_FEATURES.ETH_SIGN, safeVersion)) {
        throw new Error('eth_sign is only supported by Safes >= v1.1.0')
      }
      const txHash = await this.getTransactionHash(transaction)
      signature = await this.signTransactionHash(txHash)
    }

    const signedSafeTransaction = await this.createTransaction({
      safeTransactionData: transaction.data
    })
    transaction.signatures.forEach((signature) => {
      signedSafeTransaction.addSignature(signature)
    })
    signedSafeTransaction.addSignature(signature)
    return signedSafeTransaction
  }

  /**
   * Approves on-chain a hash using the current signer account.
   *
   * @param hash - The hash to approve
   * @param options - The Safe transaction execution options. Optional
   * @returns The Safe transaction response
   * @throws "Transaction hashes can only be approved by Safe owners"
   * @throws "Cannot specify gas and gasLimit together in transaction options"
   */
  async approveTransactionHash(
    hash: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }

    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transaction hashes can only be approved by Safe owners')
    }
    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }
    return this.#contractManager.safeContract.approveHash(hash, {
      from: signerAddress,
      ...options
    })
  }

  /**
   * Returns a list of owners who have approved a specific Safe transaction.
   *
   * @param txHash - The Safe transaction hash
   * @returns The list of owners
   */
  async getOwnersWhoApprovedTx(txHash: string): Promise<string[]> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }

    const owners = await this.getOwners()
    const ownersWhoApproved: string[] = []
    for (const owner of owners) {
      const approved = await this.#contractManager.safeContract.approvedHashes(owner, txHash)
      if (approved.gt(0)) {
        ownersWhoApproved.push(owner)
      }
    }
    return ownersWhoApproved
  }

  /**
   * Returns the Safe transaction to enable the fallback handler.
   *
   * @param address - The new fallback handler address
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid fallback handler address provided"
   * @throws "Fallback handler provided is already enabled"
   * @throws "Current version of the Safe does not support the fallback handler functionality"
   */
  async createEnableFallbackHandlerTx(
    fallbackHandlerAddress: string,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#fallbackHandlerManager.encodeEnableFallbackHandlerData(
        fallbackHandlerAddress
      ),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to disable the fallback handler.
   *
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "There is no fallback handler enabled yet"
   * @throws "Current version of the Safe does not support the fallback handler functionality"
   */
  async createDisableFallbackHandlerTx(
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#fallbackHandlerManager.encodeDisableFallbackHandlerData(),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to enable a Safe guard.
   *
   * @param guardAddress - The desired guard address
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid guard address provided"
   * @throws "Guard provided is already enabled"
   * @throws "Current version of the Safe does not support Safe transaction guards functionality"
   */
  async createEnableGuardTx(
    guardAddress: string,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#guardManager.encodeEnableGuardData(guardAddress),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to disable a Safe guard.
   *
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "There is no guard enabled yet"
   * @throws "Current version of the Safe does not support Safe transaction guards functionality"
   */
  async createDisableGuardTx(options?: SafeTransactionOptionalProps): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#guardManager.encodeDisableGuardData(),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to enable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid module address provided"
   * @throws "Module provided is already enabled"
   */
  async createEnableModuleTx(
    moduleAddress: string,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeEnableModuleData(moduleAddress),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to disable a Safe module.
   *
   * @param moduleAddress - The desired module address
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid module address provided"
   * @throws "Module provided is not enabled already"
   */
  async createDisableModuleTx(
    moduleAddress: string,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeDisableModuleData(moduleAddress),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to add an owner and optionally change the threshold.
   *
   * @param params - The transaction params
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid owner address provided"
   * @throws "Address provided is already an owner"
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async createAddOwnerTx(
    { ownerAddress, threshold }: AddOwnerTxParams,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeAddOwnerWithThresholdData(ownerAddress, threshold),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to remove an owner and optionally change the threshold.
   *
   * @param params - The transaction params
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid owner address provided"
   * @throws "Address provided is not an owner"
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async createRemoveOwnerTx(
    { ownerAddress, threshold }: RemoveOwnerTxParams,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeRemoveOwnerData(ownerAddress, threshold),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to replace an owner of the Safe with a new one.
   *
   * @param params - The transaction params
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Invalid new owner address provided"
   * @throws "Invalid old owner address provided"
   * @throws "New address provided is already an owner"
   * @throws "Old address provided is not an owner"
   */
  async createSwapOwnerTx(
    { oldOwnerAddress, newOwnerAddress }: SwapOwnerTxParams,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeSwapOwnerData(oldOwnerAddress, newOwnerAddress),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Returns the Safe transaction to change the threshold.
   *
   * @param threshold - The new threshold
   * @param options - The transaction optional properties
   * @returns The Safe transaction ready to be signed
   * @throws "Threshold needs to be greater than 0"
   * @throws "Threshold cannot exceed owner count"
   */
  async createChangeThresholdTx(
    threshold: number,
    options?: SafeTransactionOptionalProps
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeChangeThresholdData(threshold),
      ...options
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    return safeTransaction
  }

  /**
   * Converts a transaction from type SafeMultisigTransactionResponse to type SafeTransaction
   *
   * @param serviceTransactionResponse - The transaction to convert
   * @returns The converted transaction with type SafeTransaction
   */
  async toSafeTransactionType(
    serviceTransactionResponse: SafeMultisigTransactionResponse
  ): Promise<SafeTransaction> {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: serviceTransactionResponse.to,
      value: serviceTransactionResponse.value,
      data: serviceTransactionResponse.data || '0x',
      operation: serviceTransactionResponse.operation,
      safeTxGas: serviceTransactionResponse.safeTxGas.toString(),
      baseGas: serviceTransactionResponse.baseGas.toString(),
      gasPrice: serviceTransactionResponse.gasPrice,
      gasToken: serviceTransactionResponse.gasToken,
      refundReceiver: serviceTransactionResponse.refundReceiver,
      nonce: serviceTransactionResponse.nonce
    }
    const safeTransaction = await this.createTransaction({ safeTransactionData })
    serviceTransactionResponse.confirmations?.map((confirmation) => {
      const signature = new EthSafeSignature(confirmation.owner, confirmation.signature)
      safeTransaction.addSignature(signature)
    })
    return safeTransaction
  }

  /**
   * Checks if a Safe transaction can be executed successfully with no errors.
   *
   * @param safeTransaction - The Safe transaction to check
   * @param options - The Safe transaction execution options. Optional
   * @returns TRUE if the Safe transaction can be executed successfully with no errors
   */
  async isValidTransaction(
    safeTransaction: SafeTransaction | SafeMultisigTransactionResponse,
    options?: TransactionOptions
  ): Promise<boolean> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }
    const transaction = isSafeMultisigTransactionResponse(safeTransaction)
      ? await this.toSafeTransactionType(safeTransaction)
      : safeTransaction

    const signedSafeTransaction = await this.copyTransaction(transaction)

    const txHash = await this.getTransactionHash(signedSafeTransaction)
    const ownersWhoApprovedTx = await this.getOwnersWhoApprovedTx(txHash)
    for (const owner of ownersWhoApprovedTx) {
      signedSafeTransaction.addSignature(generatePreValidatedSignature(owner))
    }
    const owners = await this.getOwners()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    if (owners.includes(signerAddress)) {
      signedSafeTransaction.addSignature(generatePreValidatedSignature(signerAddress))
    }

    const isTxValid = await this.#contractManager.safeContract.isValidTransaction(
      signedSafeTransaction,
      {
        from: signerAddress,
        ...options
      }
    )
    return isTxValid
  }

  /**
   * Executes a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction to execute
   * @param options - The Safe transaction execution options. Optional
   * @returns The Safe transaction response
   * @throws "No signer provided"
   * @throws "There are X signatures missing"
   * @throws "Cannot specify gas and gasLimit together in transaction options"
   */
  async executeTransaction(
    safeTransaction: SafeTransaction | SafeMultisigTransactionResponse,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }
    const transaction = isSafeMultisigTransactionResponse(safeTransaction)
      ? await this.toSafeTransactionType(safeTransaction)
      : safeTransaction

    const signedSafeTransaction = await this.copyTransaction(transaction)

    const txHash = await this.getTransactionHash(signedSafeTransaction)
    const ownersWhoApprovedTx = await this.getOwnersWhoApprovedTx(txHash)
    for (const owner of ownersWhoApprovedTx) {
      signedSafeTransaction.addSignature(generatePreValidatedSignature(owner))
    }
    const owners = await this.getOwners()
    const threshold = await this.getThreshold()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (
      threshold > signedSafeTransaction.signatures.size &&
      signerAddress &&
      owners.includes(signerAddress)
    ) {
      signedSafeTransaction.addSignature(generatePreValidatedSignature(signerAddress))
    }

    if (threshold > signedSafeTransaction.signatures.size) {
      const signaturesMissing = threshold - signedSafeTransaction.signatures.size
      throw new Error(
        `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${
          signaturesMissing > 1 ? 's' : ''
        } missing`
      )
    }

    const value = BigNumber.from(signedSafeTransaction.data.value)
    if (!value.isZero()) {
      const balance = await this.getBalance()
      if (value.gt(BigNumber.from(balance))) {
        throw new Error('Not enough Ether funds')
      }
    }

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }
    const txResponse = await this.#contractManager.safeContract.execTransaction(
      signedSafeTransaction,
      {
        from: signerAddress,
        ...options
      }
    )
    return txResponse
  }

  /**
   * Returns the Safe Transaction encoded
   *
   * @async
   * @param {SafeTransaction} safeTransaction - The Safe transaction to be encoded.
   * @returns {Promise<string>} The encoded transaction
   *
   */
  async getEncodedTransaction(safeTransaction: SafeTransaction): Promise<string> {
    const safeVersion = await this.getContractVersion()
    const chainId = await this.getChainId()
    const customContracts = this.#contractManager.contractNetworks?.[chainId]
    const isL1SafeMasterCopy = this.#contractManager.isL1SafeMasterCopy

    const safeSingletonContract = await getSafeContract({
      ethAdapter: this.#ethAdapter,
      safeVersion: safeVersion,
      isL1SafeMasterCopy,
      customContracts
    })

    const encodedTransaction: string = safeSingletonContract.encode('execTransaction', [
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures()
    ]) as string

    return encodedTransaction
  }

  /**
   * Wraps a Safe transaction into a Safe deployment batch.
   *
   * This function creates a transaction batch of 2 transactions, which includes the
   * deployment of the Safe and the provided Safe transaction.
   *
   * @async
   * @param {SafeTransaction} safeTransaction - The Safe transaction to be wrapped into the deployment batch.
   * @param {TransactionOptions} [transactionOptions] - Optional. Options for the transaction, such as from, gas price, gas limit, etc.
   * @param {string} [customSaltNonce] - Optional. a Custom salt nonce to be used for the deployment of the Safe. If not provided, a default value is used.
   * @returns {Promise<Transaction>} A promise that resolves to a Transaction object representing the prepared batch of transactions.
   * @throws Will throw an error if the safe is already deployed.
   *
   */
  async wrapSafeTransactionIntoDeploymentBatch(
    safeTransaction: SafeTransaction,
    transactionOptions?: TransactionOptions,
    customSaltNonce?: string
  ): Promise<Transaction> {
    const isSafeDeployed = await this.isSafeDeployed()

    // if the safe is already deployed throws an error
    if (isSafeDeployed) {
      throw new Error('Safe already deployed')
    }

    // we create the deployment transaction
    const safeDeploymentTransaction = await this.createSafeDeploymentTransaction(customSaltNonce)

    // First transaction of the batch: The Safe deployment Transaction
    const safeDeploymentBatchTransaction = {
      to: safeDeploymentTransaction.to,
      value: safeDeploymentTransaction.value,
      data: safeDeploymentTransaction.data,
      operation: OperationType.Call
    }

    // Second transaction of the batch: The Safe Transaction
    const safeBatchTransaction = {
      to: await this.getAddress(),
      value: '0',
      data: await this.getEncodedTransaction(safeTransaction),
      operation: OperationType.Call
    }

    // transactions for the batch
    const transactions = [safeDeploymentBatchTransaction, safeBatchTransaction]

    // this is the transaction with the batch
    const safeDeploymentBatch = await this.createTransactionBatch(transactions, transactionOptions)

    return safeDeploymentBatch
  }

  /**
   * Creates a Safe deployment transaction.
   *
   * This function prepares a transaction for the deployment of a Safe.
   * Both the saltNonce and options parameters are optional, and if not
   * provided, default values will be used.
   *
   * @async
   * @param {string} [customSaltNonce] - Optional. a Custom salt nonce to be used for the deployment of the Safe. If not provided, a default value is used.
   * @param {TransactionOptions} [options] - Optional. Options for the transaction, such as gas price, gas limit, etc.
   * @returns {Promise<Transaction>} A promise that resolves to a Transaction object representing the prepared Safe deployment transaction.
   *
   */
  async createSafeDeploymentTransaction(
    customSaltNonce?: string,
    transactionOptions?: TransactionOptions
  ): Promise<Transaction> {
    if (!this.#predictedSafe) {
      throw new Error('Predict Safe should be present')
    }

    const { safeAccountConfig, safeDeploymentConfig } = this.#predictedSafe

    const safeVersion = await this.getContractVersion()
    const ethAdapter = this.#ethAdapter
    const chainId = await ethAdapter.getChainId()
    const isL1SafeMasterCopy = this.#contractManager.isL1SafeMasterCopy
    const customContracts = this.#contractManager.contractNetworks?.[chainId]

    const safeSingletonContract = await getSafeContract({
      ethAdapter: this.#ethAdapter,
      safeVersion,
      isL1SafeMasterCopy,
      customContracts
    })

    // we use the SafeProxyFactory.sol contract, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/proxies/SafeProxyFactory.sol
    const safeProxyFactoryContract = await getProxyFactoryContract({
      ethAdapter,
      safeVersion,
      customContracts
    })

    // this is the call to the setup method that sets the threshold & owners of the new Safe, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/Safe.sol#L95
    const initializer = await encodeSetupCallData({
      ethAdapter,
      safeContract: safeSingletonContract,
      safeAccountConfig: safeAccountConfig,
      customContracts
    })

    const saltNonce = customSaltNonce || safeDeploymentConfig?.saltNonce || PREDETERMINED_SALT_NONCE

    const safeDeployTransactionData = {
      ...transactionOptions, // optional transaction options like from, gasLimit, gasPrice...
      to: safeProxyFactoryContract.getAddress(),
      value: '0',
      // we use the createProxyWithNonce method to create the Safe in a deterministic address, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/proxies/SafeProxyFactory.sol#L52
      data: safeProxyFactoryContract.encode('createProxyWithNonce', [
        safeSingletonContract.getAddress(),
        initializer, // call to the setup method to set the threshold & owners of the new Safe
        saltNonce
      ])
    }

    return safeDeployTransactionData
  }

  /**
   * This function creates a batch of the provided Safe transactions using the MultiSend contract.
   * It groups the transactions together into a single transaction which can then be executed atomically.
   *
   * @async
   * @function createTransactionBatch
   * @param {MetaTransactionData[]} transactions - An array of MetaTransactionData objects to be batched together.
   * @param {TransactionOption} [transactionOptions] - Optional TransactionOption object to specify additional options for the transaction batch.
   * @returns {Promise<Transaction>} A Promise that resolves with the created transaction batch.
   *
   */
  async createTransactionBatch(
    transactions: MetaTransactionData[],
    transactionOptions?: TransactionOptions
  ): Promise<Transaction> {
    const chainId = await this.#ethAdapter.getChainId()

    // we use the MultiSend contract to create the batch, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/libraries/MultiSendCallOnly.sol
    const multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      ethAdapter: this.#ethAdapter,
      safeVersion: await this.getContractVersion(),
      customContracts: this.#contractManager.contractNetworks?.[chainId]
    })

    // multiSend method with the transactions encoded
    const batchData = multiSendCallOnlyContract.encode('multiSend', [
      encodeMultiSendData(transactions) // encoded transactions
    ])

    const transactionBatch = {
      ...transactionOptions, // optional transaction options like from, gasLimit, gasPrice...
      to: multiSendCallOnlyContract.getAddress(),
      value: '0',
      data: batchData
    }

    return transactionBatch
  }
}

export default Safe
