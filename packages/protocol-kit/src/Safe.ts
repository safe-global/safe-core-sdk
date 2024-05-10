import {
  OperationType,
  SafeMultisigTransactionResponse,
  SafeMultisigConfirmationResponse,
  SafeSignature,
  SafeTransaction,
  SafeTransactionDataPartial,
  SafeEIP712Args,
  SafeVersion,
  TransactionOptions,
  TransactionResult,
  MetaTransactionData,
  Transaction,
  EIP712TypedData,
  SafeTransactionData,
  CompatibilityFallbackHandlerContractType
} from '@safe-global/safe-core-sdk-types'
import {
  encodeSetupCallData,
  getChainSpecificDefaultSaltNonce,
  getPredictedSafeAddressInitCode,
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
  SigningMethod,
  SigningMethodType,
  SwapOwnerTxParams,
  SafeModulesPaginated
} from './types'
import {
  EthSafeSignature,
  SAFE_FEATURES,
  calculateSafeMessageHash,
  calculateSafeTransactionHash,
  hasSafeFeature,
  hashSafeMessage,
  isSafeMultisigTransactionResponse,
  sameString,
  buildSignatureBytes,
  generateEIP712Signature,
  generatePreValidatedSignature,
  generateSignature,
  preimageSafeMessageHash,
  preimageSafeTransactionHash
} from './utils'
import EthSafeTransaction from './utils/transactions/SafeTransaction'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import {
  encodeMultiSendData,
  standardizeMetaTransactionData,
  standardizeSafeTransactionData
} from './utils/transactions/utils'
import { isSafeConfigWithPredictedSafe } from './utils/types'
import {
  getCompatibilityFallbackHandlerContract,
  getMultiSendCallOnlyContract,
  getProxyFactoryContract
} from './contracts/safeDeploymentContracts'
import SafeMessage from './utils/messages/SafeMessage'
import semverSatisfies from 'semver/functions/satisfies'
import SafeProvider from './SafeProvider'

const EQ_OR_GT_1_4_1 = '>=1.4.1'
const EQ_OR_GT_1_3_0 = '>=1.3.0'

class Safe {
  #predictedSafe?: PredictedSafeProps
  #safeProvider!: SafeProvider
  #contractManager!: ContractManager
  #ownerManager!: OwnerManager
  #moduleManager!: ModuleManager
  #guardManager!: GuardManager
  #fallbackHandlerManager!: FallbackHandlerManager

  #MAGIC_VALUE = '0x1626ba7e'
  #MAGIC_VALUE_BYTES = '0x20c13b0b'

  /**
   * Creates an instance of the Safe Core SDK.
   * @param config - Ethers Safe configuration
   * @returns The Safe Core SDK instance
   * @throws "The SDK must be initialized with a safeAddress or a predictedSafe"
   * @throws "SafeProxy contract is not deployed on the current network"
   * @throws "MultiSend contract is not deployed on the current network"
   * @throws "MultiSendCallOnly contract is not deployed on the current network"
   */
  static async init(config: SafeConfig): Promise<Safe> {
    const protocolKit = new Safe()
    await protocolKit.#initializeProtocolKit(config)
    return protocolKit
  }

  /**
   * Initializes the Safe Core SDK instance.
   * @param config - Safe configuration
   * @throws "Signer must be connected to a provider"
   * @throws "SafeProxy contract is not deployed on the current network"
   * @throws "MultiSend contract is not deployed on the current network"
   * @throws "MultiSendCallOnly contract is not deployed on the current network"
   */
  async #initializeProtocolKit(config: SafeConfig) {
    const { provider, signer, isL1SafeSingleton, contractNetworks } = config

    this.#safeProvider = new SafeProvider({
      provider,
      signer
    })
    if (isSafeConfigWithPredictedSafe(config)) {
      this.#predictedSafe = config.predictedSafe
      this.#contractManager = await ContractManager.init(
        {
          provider,
          predictedSafe: this.#predictedSafe,
          isL1SafeSingleton,
          contractNetworks
        },
        this.#safeProvider
      )
    } else {
      this.#contractManager = await ContractManager.init(
        {
          provider,
          safeAddress: config.safeAddress,
          isL1SafeSingleton,
          contractNetworks
        },
        this.#safeProvider
      )
    }

    this.#ownerManager = new OwnerManager(this.#safeProvider, this.#contractManager.safeContract)
    this.#moduleManager = new ModuleManager(this.#safeProvider, this.#contractManager.safeContract)
    this.#guardManager = new GuardManager(this.#safeProvider, this.#contractManager.safeContract)
    this.#fallbackHandlerManager = new FallbackHandlerManager(
      this.#safeProvider,
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
    const { provider, signer, safeAddress, predictedSafe, isL1SafeSingleton, contractNetworks } =
      config
    const configProps: SafeConfigProps = {
      provider: provider || this.#safeProvider.provider,
      signer,
      isL1SafeSingleton: isL1SafeSingleton || this.#contractManager.isL1SafeSingleton,
      contractNetworks: contractNetworks || this.#contractManager.contractNetworks
    }

    // A new existing Safe is connected to the Signer
    if (safeAddress) {
      return await Safe.init({
        safeAddress,
        ...configProps
      })
    }

    // A new predicted Safe is connected to the Signer
    if (predictedSafe) {
      return await Safe.init({
        predictedSafe,
        ...configProps
      })
    }

    // The previous predicted Safe is connected to a new Signer
    if (this.#predictedSafe) {
      return await Safe.init({
        predictedSafe: this.#predictedSafe,
        ...configProps
      })
    }

    // The previous existing Safe is connected to a new Signer
    return await Safe.init({
      safeAddress: await this.getAddress(),
      ...configProps
    })
  }

  /**
   * Returns the initialization code to deploy a Safe account based on the predicted address.
   *
   * @returns The Safe configuration
   */
  async getInitCode(): Promise<string> {
    if (!this.#predictedSafe) {
      throw new Error('The Safe already exists')
    }

    const chainId = await this.#safeProvider.getChainId()

    return getPredictedSafeAddressInitCode({
      safeProvider: this.#safeProvider,
      chainId,
      customContracts: this.#contractManager.contractNetworks?.[chainId.toString()],
      ...this.#predictedSafe
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

      const chainId = await this.#safeProvider.getChainId()
      return predictSafeAddress({
        safeProvider: this.#safeProvider,
        chainId,
        customContracts: this.#contractManager.contractNetworks?.[chainId.toString()],
        ...this.#predictedSafe
      })
    }

    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }

    return await this.#contractManager.safeContract.getAddress()
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
   * Returns the current SafeProvider.
   *
   * @returns The current SafeProvider
   */
  getSafeProvider(): SafeProvider {
    return this.#safeProvider
  }

  /**
   * Returns the address of the MultiSend contract.
   *
   * @returns The address of the MultiSend contract
   */
  async getMultiSendAddress(): Promise<string> {
    return await this.#contractManager.multiSendContract.getAddress()
  }

  /**
   * Returns the address of the MultiSendCallOnly contract.
   *
   * @returns The address of the MultiSendCallOnly contract
   */
  async getMultiSendCallOnlyAddress(): Promise<string> {
    return await this.#contractManager.multiSendCallOnlyContract.getAddress()
  }

  /**
   * Checks if the current Safe is deployed.
   *
   * @returns TRUE if the Safe contract is deployed
   */
  async isSafeDeployed(): Promise<boolean> {
    const safeAddress = await this.getAddress()
    const isSafeDeployed = await this.#safeProvider.isContractDeployed(safeAddress)
    return isSafeDeployed
  }

  /**
   * Returns the Safe Singleton contract version.
   *
   * @returns The Safe Singleton contract version
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

    const nonce = await this.#contractManager.safeContract.getNonce()

    return Number(nonce)
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
  async getChainId(): Promise<bigint> {
    return this.#safeProvider.getChainId()
  }

  /**
   * Returns the ETH balance of the Safe.
   *
   * @returns The ETH balance of the Safe
   */
  async getBalance(): Promise<bigint> {
    return this.#safeProvider.getBalance(await this.getAddress())
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
   * Returns the list of addresses of all the enabled Safe modules. The list will start on the next position address in relation to start.
   *
   * @param start - The address to be "offsetted" from the list, should be SENTINEL_ADDRESS otherwise.
   * @param pageSize - The size of the page. It will be the max length of the returning array. Must be greater then 0.
   * @returns The list of addresses of all the enabled Safe modules
   */
  async getModulesPaginated(start: string, pageSize: number = 10): Promise<SafeModulesPaginated> {
    return this.#moduleManager.getModulesPaginated(start, pageSize)
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
    transactions,
    onlyCalls = false,
    options
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const safeVersion = await this.getContractVersion()
    if (this.#predictedSafe && !hasSafeFeature(SAFE_FEATURES.ACCOUNT_ABSTRACTION, safeVersion)) {
      throw new Error(
        'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
      )
    }

    if (transactions.length === 0) {
      throw new Error('Invalid empty array of transactions')
    }

    let newTransaction: SafeTransactionDataPartial
    if (transactions.length > 1) {
      const multiSendContract = onlyCalls
        ? this.#contractManager.multiSendCallOnlyContract
        : this.#contractManager.multiSendContract

      const multiSendData = encodeMultiSendData(transactions.map(standardizeMetaTransactionData))

      const multiSendTransaction = {
        ...options,
        to: await multiSendContract.getAddress(),
        value: '0',
        data: multiSendContract.encode('multiSend', [multiSendData]),
        operation: OperationType.DelegateCall
      }
      newTransaction = multiSendTransaction
    } else {
      newTransaction = { ...options, ...transactions[0] }
    }

    if (this.#predictedSafe) {
      return new EthSafeTransaction(
        await standardizeSafeTransactionData({
          predictedSafe: this.#predictedSafe,
          provider: this.#safeProvider.provider,
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
        provider: this.#safeProvider.provider,
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: '0x'
    }
    const options = {
      nonce,
      safeTxGas: '0'
    } as SafeTransactionOptionalProps

    return this.createTransaction({ transactions: [safeTransactionData], options })
  }

  /**
   * Copies a Safe transaction
   *
   * @param safeTransaction - The Safe transaction
   * @returns The new Safe transaction
   */
  async copyTransaction(safeTransaction: SafeTransaction): Promise<SafeTransaction> {
    const { to, value, data, operation, ...options } = safeTransaction.data
    const safeTransactionData = {
      to,
      value,
      data,
      operation
    }
    const signedSafeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
    safeTransaction.signatures.forEach((signature: EthSafeSignature) => {
      signedSafeTransaction.addSignature(signature)
    })
    return signedSafeTransaction
  }

  /**
   * Returns the transaction hash of a Safe transaction.
   *
   * @param safeTransaction - The Safe transaction
   * @returns The hash of the Safe transaction
   */
  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    const safeAddress = await this.getAddress()
    const safeVersion = await this.getContractVersion()
    const chainId = await this.getChainId()

    return calculateSafeTransactionHash(safeAddress, safeTransaction.data, safeVersion, chainId)
  }

  /**
   * Signs a hash using the current signer account.
   *
   * @param hash - The hash to sign
   * @returns The Safe signature
   */
  async signHash(hash: string): Promise<SafeSignature> {
    const signature = await generateSignature(this.#safeProvider, hash)

    return signature
  }

  /**
   * Returns a Safe message ready to be signed by the owners.
   *
   * @param message - The message
   * @returns The Safe message
   */
  createMessage(message: string | EIP712TypedData): SafeMessage {
    return new SafeMessage(message)
  }

  /**
   * Returns the Safe message with a new signature
   *
   * @param message The message to be signed
   * @param signingMethod The signature type
   * @param preimageSafeAddress If the preimage is required, the address of the Safe that will be used to calculate the preimage.
   * This field is mandatory for 1.4.1 contract versions Because the safe uses the old EIP-1271 interface which uses `bytes` instead of `bytes32` for the message
   * we need to use the pre-image of the message to calculate the message hash
   * https://github.com/safe-global/safe-contracts/blob/192c7dc67290940fcbc75165522bb86a37187069/test/core/Safe.Signatures.spec.ts#L229-L233
   * @returns The signed Safe message
   */
  async signMessage(
    message: SafeMessage,
    signingMethod: SigningMethodType = SigningMethod.ETH_SIGN_TYPED_DATA_V4,
    preimageSafeAddress?: string
  ): Promise<SafeMessage> {
    const owners = await this.getOwners()
    const signerAddress = await this.#safeProvider.getSignerAddress()
    if (!signerAddress) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }

    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Messages can only be signed by Safe owners')
    }

    const safeVersion = await this.getContractVersion()
    if (
      signingMethod === SigningMethod.SAFE_SIGNATURE &&
      semverSatisfies(safeVersion, EQ_OR_GT_1_4_1) &&
      !preimageSafeAddress
    ) {
      throw new Error('The parent Safe account address is mandatory for contract signatures')
    }

    let signature: SafeSignature

    if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V4) {
      signature = await this.signTypedData(message, 'v4')
    } else if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V3) {
      signature = await this.signTypedData(message, 'v3')
    } else if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA) {
      signature = await this.signTypedData(message, undefined)
    } else {
      const chainId = await this.getChainId()
      if (!hasSafeFeature(SAFE_FEATURES.ETH_SIGN, safeVersion)) {
        throw new Error('eth_sign is only supported by Safes >= v1.1.0')
      }

      let safeMessageHash: string

      if (
        signingMethod === SigningMethod.SAFE_SIGNATURE &&
        preimageSafeAddress &&
        semverSatisfies(safeVersion, EQ_OR_GT_1_4_1)
      ) {
        const messageHashData = preimageSafeMessageHash(
          preimageSafeAddress,
          hashSafeMessage(message.data),
          safeVersion,
          chainId
        )

        safeMessageHash = await this.getSafeMessageHash(messageHashData)
      } else {
        safeMessageHash = await this.getSafeMessageHash(hashSafeMessage(message.data))
      }

      signature = await this.signHash(safeMessageHash)
    }

    const signedSafeMessage = this.createMessage(message.data)

    message.signatures.forEach((signature: EthSafeSignature) => {
      signedSafeMessage.addSignature(signature)
    })

    signedSafeMessage.addSignature(signature)

    return signedSafeMessage
  }

  /**
   * Signs a transaction according to the EIP-712 using the current signer account.
   *
   * @param eip712Data - The Safe Transaction or message hash to be signed
   * @param methodVersion - EIP-712 version. Optional
   * @returns The Safe signature
   */
  async signTypedData(
    eip712Data: SafeTransaction | SafeMessage,
    methodVersion?: 'v3' | 'v4'
  ): Promise<SafeSignature> {
    const safeEIP712Args: SafeEIP712Args = {
      safeAddress: await this.getAddress(),
      safeVersion: await this.getContractVersion(),
      chainId: await this.#safeProvider.getChainId(),
      data: eip712Data.data
    }

    return generateEIP712Signature(this.#safeProvider, safeEIP712Args, methodVersion)
  }

  /**
   * Adds the signature of the current signer to the Safe transaction object.
   *
   * @param safeTransaction - The Safe transaction to be signed
   * @param signingMethod - Method followed to sign a transaction. Optional. Default value is "eth_sign"
   * @param preimageSafeAddress - If the preimage is required, the address of the Safe that will be used to calculate the preimage
   * This field is mandatory for 1.3.0 and 1.4.1 contract versions Because the safe uses the old EIP-1271 interface which uses `bytes` instead of `bytes32` for the message
   * we need to use the pre-image of the message to calculate the message hash
   * https://github.com/safe-global/safe-contracts/blob/192c7dc67290940fcbc75165522bb86a37187069/test/core/Safe.Signatures.spec.ts#L229-L233
   * @returns The signed Safe transaction
   * @throws "Transactions can only be signed by Safe owners"
   */
  async signTransaction(
    safeTransaction: SafeTransaction | SafeMultisigTransactionResponse,
    signingMethod: SigningMethodType = SigningMethod.ETH_SIGN_TYPED_DATA_V4,
    preimageSafeAddress?: string
  ): Promise<SafeTransaction> {
    const transaction = isSafeMultisigTransactionResponse(safeTransaction)
      ? await this.toSafeTransactionType(safeTransaction)
      : safeTransaction

    const owners = await this.getOwners()
    const signerAddress = await this.#safeProvider.getSignerAddress()

    if (!signerAddress) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }

    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transactions can only be signed by Safe owners')
    }

    const safeVersion = await this.getContractVersion()
    if (
      signingMethod === SigningMethod.SAFE_SIGNATURE &&
      semverSatisfies(safeVersion, EQ_OR_GT_1_3_0) &&
      !preimageSafeAddress
    ) {
      throw new Error('The parent Safe account address is mandatory for contract signatures')
    }

    let signature: SafeSignature

    if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V4) {
      signature = await this.signTypedData(transaction, 'v4')
    } else if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA_V3) {
      signature = await this.signTypedData(transaction, 'v3')
    } else if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA) {
      signature = await this.signTypedData(transaction, undefined)
    } else {
      const safeVersion = await this.getContractVersion()
      const chainId = await this.getChainId()
      if (!hasSafeFeature(SAFE_FEATURES.ETH_SIGN, safeVersion)) {
        throw new Error('eth_sign is only supported by Safes >= v1.1.0')
      }

      let txHash: string

      // IMPORTANT: because the safe uses the old EIP-1271 interface which uses `bytes` instead of `bytes32` for the message
      // we need to use the pre-image of the transaction hash to calculate the message hash
      // https://github.com/safe-global/safe-contracts/blob/192c7dc67290940fcbc75165522bb86a37187069/test/core/Safe.Signatures.spec.ts#L229-L233
      if (
        signingMethod === SigningMethod.SAFE_SIGNATURE &&
        semverSatisfies(safeVersion, EQ_OR_GT_1_3_0) &&
        preimageSafeAddress
      ) {
        const txHashData = preimageSafeTransactionHash(
          preimageSafeAddress,
          safeTransaction.data as SafeTransactionData,
          safeVersion,
          chainId
        )

        txHash = await this.getSafeMessageHash(txHashData)
      } else {
        txHash = await this.getTransactionHash(transaction)
      }
      signature = await this.signHash(txHash)
    }

    const signedSafeTransaction = await this.copyTransaction(transaction)
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
    const signerAddress = await this.#safeProvider.getSignerAddress()
    if (!signerAddress) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }
    const addressIsOwner = owners.some(
      (owner: string) => signerAddress && sameString(owner, signerAddress)
    )
    if (!addressIsOwner) {
      throw new Error('Transaction hashes can only be approved by Safe owners')
    }

    // TODO: fix this
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
      const [approved] = await this.#contractManager.safeContract.approvedHashes([owner, txHash])
      if (approved > 0) {
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#fallbackHandlerManager.encodeEnableFallbackHandlerData(
        fallbackHandlerAddress
      )
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#fallbackHandlerManager.encodeDisableFallbackHandlerData()
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#guardManager.encodeEnableGuardData(guardAddress)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#guardManager.encodeDisableGuardData()
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeEnableModuleData(moduleAddress)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#moduleManager.encodeDisableModuleData(moduleAddress)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeAddOwnerWithThresholdData(ownerAddress, threshold)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeRemoveOwnerData(ownerAddress, threshold)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeSwapOwnerData(oldOwnerAddress, newOwnerAddress)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData: MetaTransactionData = {
      to: await this.getAddress(),
      value: '0',
      data: await this.#ownerManager.encodeChangeThresholdData(threshold)
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
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
    const safeTransactionData = {
      to: serviceTransactionResponse.to,
      value: serviceTransactionResponse.value,
      data: serviceTransactionResponse.data || '0x',
      operation: serviceTransactionResponse.operation
    }
    const options = {
      safeTxGas: serviceTransactionResponse.safeTxGas.toString(),
      baseGas: serviceTransactionResponse.baseGas.toString(),
      gasPrice: serviceTransactionResponse.gasPrice,
      gasToken: serviceTransactionResponse.gasToken,
      refundReceiver: serviceTransactionResponse.refundReceiver,
      nonce: serviceTransactionResponse.nonce
    }
    const safeTransaction = await this.createTransaction({
      transactions: [safeTransactionData],
      options
    })
    serviceTransactionResponse.confirmations?.map(
      (confirmation: SafeMultisigConfirmationResponse) => {
        const signature = new EthSafeSignature(confirmation.owner, confirmation.signature)
        safeTransaction.addSignature(signature)
      }
    )
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
    const signerAddress = await this.#safeProvider.getSignerAddress()
    if (!signerAddress) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
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
    const signerAddress = await this.#safeProvider.getSignerAddress()
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

    const value = BigInt(signedSafeTransaction.data.value)
    if (value !== 0n) {
      const balance = await this.getBalance()
      if (value > balance) {
        throw new Error('Not enough Ether funds')
      }
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
    const customContracts = this.#contractManager.contractNetworks?.[chainId.toString()]
    const isL1SafeSingleton = this.#contractManager.isL1SafeSingleton

    const safeSingletonContract = await this.#safeProvider.getSafeContract({
      safeVersion,
      isL1SafeSingleton,
      customContractAbi: customContracts?.safeSingletonAbi,
      customContractAddress: customContracts?.safeSingletonAddress
    })

    const encodedTransaction = safeSingletonContract.encode('execTransaction', [
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
    ])

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
    const safeProvider = this.#safeProvider
    const chainId = await safeProvider.getChainId()
    const isL1SafeSingleton = this.#contractManager.isL1SafeSingleton
    const customContracts = this.#contractManager.contractNetworks?.[chainId.toString()]

    const safeSingletonContract = await safeProvider.getSafeContract({
      safeVersion,
      isL1SafeSingleton,
      customContractAddress: customContracts?.safeSingletonAddress,
      customContractAbi: customContracts?.safeSingletonAbi
    })

    // we use the SafeProxyFactory.sol contract, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/proxies/SafeProxyFactory.sol
    const safeProxyFactoryContract = await getProxyFactoryContract({
      safeProvider,
      safeVersion,
      customContracts
    })

    // this is the call to the setup method that sets the threshold & owners of the new Safe, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/Safe.sol#L95
    const initializer = await encodeSetupCallData({
      safeProvider,
      safeContract: safeSingletonContract,
      safeAccountConfig: safeAccountConfig,
      customContracts
    })

    const saltNonce =
      customSaltNonce ||
      safeDeploymentConfig?.saltNonce ||
      getChainSpecificDefaultSaltNonce(chainId)

    const safeDeployTransactionData = {
      ...transactionOptions, // optional transaction options like from, gasLimit, gasPrice...
      to: await safeProxyFactoryContract.getAddress(),
      value: '0',
      // we use the createProxyWithNonce method to create the Safe in a deterministic address, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/proxies/SafeProxyFactory.sol#L52
      data: safeProxyFactoryContract.encode('createProxyWithNonce', [
        await safeSingletonContract.getAddress(),
        initializer, // call to the setup method to set the threshold & owners of the new Safe
        BigInt(saltNonce)
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
    const chainId = await this.#safeProvider.getChainId()

    // we use the MultiSend contract to create the batch, see: https://github.com/safe-global/safe-contracts/blob/main/contracts/libraries/MultiSendCallOnly.sol
    const multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      safeProvider: this.#safeProvider,
      safeVersion: await this.getContractVersion(),
      customContracts: this.#contractManager.contractNetworks?.[chainId.toString()]
    })

    // multiSend method with the transactions encoded
    const batchData = multiSendCallOnlyContract.encode('multiSend', [
      encodeMultiSendData(transactions) // encoded transactions
    ])

    const transactionBatch = {
      ...transactionOptions, // optional transaction options like from, gasLimit, gasPrice...
      to: await multiSendCallOnlyContract.getAddress(),
      value: '0',
      data: batchData
    }

    return transactionBatch
  }

  /**
   * Get the fallback handler contract
   *
   * @returns The fallback Handler contract
   */
  async #getFallbackHandlerContract(): Promise<CompatibilityFallbackHandlerContractType> {
    if (!this.#contractManager.safeContract) {
      throw new Error('Safe is not deployed')
    }

    const safeVersion =
      (await this.#contractManager.safeContract.getVersion()) ?? DEFAULT_SAFE_VERSION
    const chainId = await this.#safeProvider.getChainId()

    const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
      safeProvider: this.#safeProvider,
      safeVersion,
      customContracts: this.#contractManager.contractNetworks?.[chainId.toString()]
    })

    return compatibilityFallbackHandlerContract
  }

  /**
   * Call the CompatibilityFallbackHandler getMessageHash method
   *
   * @param messageHash The hash of the message
   * @returns Returns the Safe message hash to be signed
   * @link https://github.com/safe-global/safe-contracts/blob/8ffae95faa815acf86ec8b50021ebe9f96abde10/contracts/handler/CompatibilityFallbackHandler.sol#L26-L28
   */
  getSafeMessageHash = async (messageHash: string): Promise<string> => {
    const safeAddress = await this.getAddress()
    const safeVersion = await this.getContractVersion()
    const chainId = await this.getChainId()

    return calculateSafeMessageHash(safeAddress, messageHash, safeVersion, chainId)
  }

  /**
   * Call the CompatibilityFallbackHandler isValidSignature method
   *
   * @param messageHash The hash of the message
   * @param signature The signature to be validated or '0x'. You can send as signature one of the following:
   *  1) An array of SafeSignature. In this case the signatures are concatenated for validation (buildSignatureBytes())
   *  2) The concatenated signatures as string
   *  3) '0x' if you want to validate an onchain message (Approved hash)
   * @returns A boolean indicating if the signature is valid
   * @link https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol
   */
  isValidSignature = async (
    messageHash: string,
    signature: SafeSignature[] | string = '0x'
  ): Promise<boolean> => {
    const safeAddress = await this.getAddress()
    const fallbackHandler = await this.#getFallbackHandlerContract()

    const signatureToCheck =
      signature && Array.isArray(signature) ? buildSignatureBytes(signature) : signature

    // @ts-expect-error Argument of type isValidSignature(bytes32,bytes) is not assignable to parameter of type isValidSignature
    const data = fallbackHandler.encode('isValidSignature(bytes32,bytes)', [
      messageHash,
      signatureToCheck
    ])

    // @ts-expect-error Argument of type isValidSignature(bytes32,bytes) is not assignable to parameter of type isValidSignature
    const bytesData = fallbackHandler.encode('isValidSignature(bytes,bytes)', [
      messageHash,
      signatureToCheck
    ])

    try {
      const isValidSignatureResponse = await Promise.all([
        this.#safeProvider.call({
          from: safeAddress,
          to: safeAddress,
          data: data
        }),
        this.#safeProvider.call({
          from: safeAddress,
          to: safeAddress,
          data: bytesData
        })
      ])

      return (
        !!isValidSignatureResponse.length &&
        (isValidSignatureResponse[0].slice(0, 10).toLowerCase() === this.#MAGIC_VALUE ||
          isValidSignatureResponse[1].slice(0, 10).toLowerCase() === this.#MAGIC_VALUE_BYTES)
      )
    } catch (error) {
      return false
    }
  }
}

export default Safe
