import {
  AddMessageProps,
  AddSafeDelegateProps,
  AddSafeOperationProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DeleteSafeDelegateProps,
  GetSafeDelegateProps,
  GetSafeOperationListProps,
  GetSafeOperationListResponse,
  SafeSingletonResponse,
  GetSafeMessageListProps,
  ModulesResponse,
  OwnerResponse,
  ProposeTransactionProps,
  SafeCreationInfoResponse,
  SafeDelegateListResponse,
  SafeDelegateResponse,
  SafeInfoResponse,
  SafeMessage,
  SafeMessageListResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeServiceInfoResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from '@safe-global/api-kit/types/safeTransactionServiceTypes'
import { HttpMethod, sendRequest } from '@safe-global/api-kit/utils/httpRequests'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
import {
  Eip3770Address,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionResponse,
  SafeOperationResponse,
  SafeOperation,
  isSafeOperation
} from '@safe-global/safe-core-sdk-types'
import { TRANSACTION_SERVICE_URLS } from './utils/config'
import { isEmptyData } from './utils'
import { getAddSafeOperationProps } from './utils/safeOperation'

export interface SafeApiKitConfig {
  /** chainId - The chainId */
  chainId: bigint
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl?: string
}

class SafeApiKit {
  #chainId: bigint
  #txServiceBaseUrl: string

  constructor({ chainId, txServiceUrl }: SafeApiKitConfig) {
    this.#chainId = chainId

    if (txServiceUrl) {
      this.#txServiceBaseUrl = txServiceUrl
    } else {
      const url = TRANSACTION_SERVICE_URLS[chainId.toString()]
      if (!url) {
        throw new TypeError(
          `There is no transaction service available for chainId ${chainId}. Please set the txServiceUrl property to use a custom transaction service.`
        )
      }

      this.#txServiceBaseUrl = `${url}/api`
    }
  }

  #isValidAddress(address: string) {
    try {
      validateEthereumAddress(address)
      return true
    } catch {
      return false
    }
  }

  #getEip3770Address(fullAddress: string): Eip3770Address {
    return validateEip3770Address(fullAddress, this.#chainId)
  }

  /**
   * Returns the information and configuration of the service.
   *
   * @returns The information and configuration of the service
   */
  async getServiceInfo(): Promise<SafeServiceInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safe singletons.
   *
   * @returns The list of Safe singletons
   */
  async getServiceSingletonsInfo(): Promise<SafeSingletonResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/about/singletons`,
      method: HttpMethod.Get
    })
  }

  /**
   * Decodes the specified Safe transaction data.
   *
   * @param data - The Safe transaction data
   * @returns The transaction data decoded
   * @throws "Invalid data"
   * @throws "Not Found"
   * @throws "Ensure this field has at least 1 hexadecimal chars (not counting 0x)."
   */
  async decodeData(data: string): Promise<any> {
    if (data === '') {
      throw new Error('Invalid data')
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/data-decoder/`,
      method: HttpMethod.Post,
      body: { data }
    })
  }

  /**
   * Returns the list of Safes where the address provided is an owner.
   *
   * @param ownerAddress - The owner address
   * @returns The list of Safes where the address provided is an owner
   * @throws "Invalid owner address"
   * @throws "Checksum address validation failed"
   */
  async getSafesByOwner(ownerAddress: string): Promise<OwnerResponse> {
    if (ownerAddress === '') {
      throw new Error('Invalid owner address')
    }
    const { address } = this.#getEip3770Address(ownerAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/owners/${address}/safes/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safes where the module address provided is enabled.
   *
   * @param moduleAddress - The Safe module address
   * @returns The list of Safe addresses where the module provided is enabled
   * @throws "Invalid module address"
   * @throws "Module address checksum not valid"
   */
  async getSafesByModule(moduleAddress: string): Promise<ModulesResponse> {
    if (moduleAddress === '') {
      throw new Error('Invalid module address')
    }
    const { address } = this.#getEip3770Address(moduleAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/modules/${address}/safes/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns all the information of a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @returns The information of a Safe transaction
   * @throws "Invalid safeTxHash"
   * @throws "Not found."
   */
  async getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of confirmations for a given a Safe transaction.
   *
   * @param safeTxHash - The hash of the Safe transaction
   * @returns The list of confirmations
   * @throws "Invalid safeTxHash"
   */
  async getTransactionConfirmations(
    safeTxHash: string
  ): Promise<SafeMultisigConfirmationListResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction that will be confirmed
   * @param signature - Signature of the transaction
   * @returns
   * @throws "Invalid safeTxHash"
   * @throws "Invalid signature"
   * @throws "Malformed data"
   * @throws "Error processing data"
   */
  async confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    if (signature === '') {
      throw new Error('Invalid signature')
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Post,
      body: {
        signature
      }
    })
  }

  /**
   * Returns the information and configuration of the provided Safe address.
   *
   * @param safeAddress - The Safe address
   * @returns The information and configuration of the provided Safe address
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getSafeInfo(safeAddress: string): Promise<SafeInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of delegates.
   *
   * @param getSafeDelegateProps - Properties to filter the returned list of delegates
   * @returns The list of delegates
   * @throws "Checksum address validation failed"
   */
  async getSafeDelegates({
    safeAddress,
    delegateAddress,
    delegatorAddress,
    label,
    limit,
    offset
  }: GetSafeDelegateProps): Promise<SafeDelegateListResponse> {
    const url = new URL(`${this.#txServiceBaseUrl}/v2/delegates`)

    if (safeAddress) {
      const { address: safe } = this.#getEip3770Address(safeAddress)
      url.searchParams.set('safe', safe)
    }
    if (delegateAddress) {
      const { address: delegate } = this.#getEip3770Address(delegateAddress)
      url.searchParams.set('delegate', delegate)
    }
    if (delegatorAddress) {
      const { address: delegator } = this.#getEip3770Address(delegatorAddress)
      url.searchParams.set('delegator', delegator)
    }
    if (label) {
      url.searchParams.set('label', label)
    }
    if (limit) {
      url.searchParams.set('limit', limit)
    }
    if (offset) {
      url.searchParams.set('offset', offset)
    }

    return sendRequest({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a new delegate for a given Safe address.
   *
   * @param addSafeDelegateProps - The configuration of the new delegate
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "Checksum address validation failed"
   * @throws "Address <delegate_address> is not checksumed"
   * @throws "Safe=<safe_address> does not exist or it's still not indexed"
   * @throws "Signing owner is not an owner of the Safe"
   */
  async addSafeDelegate({
    safeAddress,
    delegateAddress,
    delegatorAddress,
    label,
    signer
  }: AddSafeDelegateProps): Promise<SafeDelegateResponse> {
    if (delegateAddress === '') {
      throw new Error('Invalid Safe delegate address')
    }
    if (delegatorAddress === '') {
      throw new Error('Invalid Safe delegator address')
    }
    if (label === '') {
      throw new Error('Invalid label')
    }
    const { address: delegate } = this.#getEip3770Address(delegateAddress)
    const { address: delegator } = this.#getEip3770Address(delegatorAddress)
    const signature = await signDelegate(signer, delegate, this.#chainId)

    const body: any = {
      safe: safeAddress ? this.#getEip3770Address(safeAddress).address : null,
      delegate,
      delegator,
      label,
      signature
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v2/delegates/`,
      method: HttpMethod.Post,
      body
    })
  }

  /**
   * Removes a delegate for a given Safe address.
   *
   * @param deleteSafeDelegateProps - The configuration for the delegate that will be removed
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Checksum address validation failed"
   * @throws "Signing owner is not an owner of the Safe"
   * @throws "Not found"
   */
  async removeSafeDelegate({
    delegateAddress,
    delegatorAddress,
    signer
  }: DeleteSafeDelegateProps): Promise<void> {
    if (delegateAddress === '') {
      throw new Error('Invalid Safe delegate address')
    }
    if (delegatorAddress === '') {
      throw new Error('Invalid Safe delegator address')
    }
    const { address: delegate } = this.#getEip3770Address(delegateAddress)
    const { address: delegator } = this.#getEip3770Address(delegatorAddress)
    const signature = await signDelegate(signer, delegate, this.#chainId)

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v2/delegates/${delegate}`,
      method: HttpMethod.Delete,
      body: {
        delegator,
        signature
      }
    })
  }

  /**
   * Returns the creation information of a Safe.
   *
   * @param safeAddress - The Safe address
   * @returns The creation information of a Safe
   * @throws "Invalid Safe address"
   * @throws "Safe creation not found"
   * @throws "Checksum address validation failed"
   * @throws "Problem connecting to Ethereum network"
   */
  async getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/creation/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Estimates the safeTxGas for a given Safe multi-signature transaction.
   *
   * @param safeAddress - The Safe address
   * @param safeTransaction - The Safe transaction to estimate
   * @returns The safeTxGas for the given Safe transaction
   * @throws "Invalid Safe address"
   * @throws "Data not valid"
   * @throws "Safe not found"
   * @throws "Tx not valid"
   */
  async estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/multisig-transactions/estimations/`,
      method: HttpMethod.Post,
      body: safeTransaction
    })
  }

  /**
   * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Transaction Service.
   *
   * @param proposeTransactionConfig - The configuration of the proposed transaction
   * @returns The hash of the Safe transaction proposed
   * @throws "Invalid Safe address"
   * @throws "Invalid safeTxHash"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address/User is not an owner/Invalid signature/Nonce already executed/Sender is not an owner"
   */
  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash,
    senderAddress,
    senderSignature,
    origin
  }: ProposeTransactionProps): Promise<void> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address: safe } = this.#getEip3770Address(safeAddress)
    const { address: sender } = this.#getEip3770Address(senderAddress)
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safe}/multisig-transactions/`,
      method: HttpMethod.Post,
      body: {
        ...safeTransactionData,
        contractTransactionHash: safeTxHash,
        sender,
        signature: senderSignature,
        origin
      }
    })
  }

  /**
   * Returns the history of incoming transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of incoming transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getIncomingTransactions(safeAddress: string): Promise<TransferListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/incoming-transfers?executed=true`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of module transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of module transactions
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/module-transactions/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of multi-signature transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of multi-signature transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/multisig-transactions/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.
   *
   * @param safeAddress - The Safe address
   * @param currentNonce - Current nonce of the Safe
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const nonce = currentNonce ? currentNonce : (await this.getSafeInfo(address)).nonce

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/multisig-transactions/?executed=false&nonce__gte=${nonce}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a list of transactions for a Safe. The list has different structures depending on the transaction type
   *
   * @param safeAddress - The Safe address
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getAllTransactions(
    safeAddress: string,
    options?: AllTransactionsOptions
  ): Promise<AllTransactionsListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/all-transactions/`)

    const trusted = options?.trusted?.toString() || 'true'
    url.searchParams.set('trusted', trusted)

    const queued = options?.queued?.toString() || 'true'
    url.searchParams.set('queued', queued)

    const executed = options?.executed?.toString() || 'false'
    url.searchParams.set('executed', executed)

    return sendRequest({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the right nonce to propose a new transaction after the last pending transaction.
   *
   * @param safeAddress - The Safe address
   * @returns The right nonce to propose a new transaction after the last pending transaction
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getNextNonce(safeAddress: string): Promise<number> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const pendingTransactions = await this.getPendingTransactions(address)
    if (pendingTransactions.results.length > 0) {
      const nonces = pendingTransactions.results.map((tx) => tx.nonce)
      const lastNonce = Math.max(...nonces)
      return lastNonce + 1
    }
    const safeInfo = await this.getSafeInfo(address)
    return safeInfo.nonce
  }

  /**
   * Returns the list of all the ERC20 tokens handled by the Safe.
   *
   * @returns The list of all the ERC20 tokens
   */
  async getTokenList(): Promise<TokenInfoListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/tokens/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the information of a given ERC20 token.
   *
   * @param tokenAddress - The token address
   * @returns The information of the given ERC20 token
   * @throws "Invalid token address"
   * @throws "Checksum address validation failed"
   */
  async getToken(tokenAddress: string): Promise<TokenInfoResponse> {
    if (tokenAddress === '') {
      throw new Error('Invalid token address')
    }
    const { address } = this.#getEip3770Address(tokenAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/tokens/${address}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Get a message by its safe message hash
   * @param messageHash The Safe message hash
   * @returns The message
   */
  async getMessage(messageHash: string): Promise<SafeMessage> {
    if (!messageHash) {
      throw new Error('Invalid messageHash')
    }

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/messages/${messageHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Get the list of messages associated to a Safe account
   * @param safeAddress The safe address
   * @param options The options to filter the list of messages
   * @returns The paginated list of messages
   */
  async getMessages(
    safeAddress: string,
    { ordering, limit, offset }: GetSafeMessageListProps = {}
  ): Promise<SafeMessageListResponse> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`)

    if (ordering) {
      url.searchParams.set('ordering', ordering)
    }

    if (limit) {
      url.searchParams.set('limit', limit)
    }

    if (offset) {
      url.searchParams.set('offset', offset)
    }

    return sendRequest({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Creates a new message with an initial signature
   * Add more signatures from other owners using addMessageSignature()
   * @param safeAddress The safe address
   * @param options The raw message to add, signature and safeAppId if any
   */
  async addMessage(safeAddress: string, addMessageProps: AddMessageProps): Promise<void> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`,
      method: HttpMethod.Post,
      body: addMessageProps
    })
  }

  /**
   * Add a signature to an existing message
   * @param messageHash The safe message hash
   * @param signature The signature
   */
  async addMessageSignature(messageHash: string, signature: string): Promise<void> {
    if (!messageHash || !signature) {
      throw new Error('Invalid messageHash or signature')
    }

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/messages/${messageHash}/signatures/`,
      method: HttpMethod.Post,
      body: {
        signature
      }
    })
  }

  /**
   * Get the SafeOperations that were sent from a particular address.
   * @param getSafeOperationsProps - The parameters to filter the list of SafeOperations
   * @throws "Safe address must not be empty"
   * @throws "Invalid Ethereum address {safeAddress}"
   * @returns The SafeOperations sent from the given Safe's address
   */
  async getSafeOperationsByAddress({
    safeAddress,
    ordering,
    limit,
    offset
  }: GetSafeOperationListProps): Promise<GetSafeOperationListResponse> {
    if (!safeAddress) {
      throw new Error('Safe address must not be empty')
    }

    const { address } = this.#getEip3770Address(safeAddress)

    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/safe-operations/`)

    if (ordering) {
      url.searchParams.set('ordering', ordering)
    }

    if (limit) {
      url.searchParams.set('limit', limit)
    }

    if (offset) {
      url.searchParams.set('offset', offset)
    }

    return sendRequest({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Get a SafeOperation by its hash.
   * @param safeOperationHash The SafeOperation hash
   * @throws "SafeOperation hash must not be empty"
   * @throws "Not found."
   * @returns The SafeOperation
   */
  async getSafeOperation(safeOperationHash: string): Promise<SafeOperationResponse> {
    if (!safeOperationHash) {
      throw new Error('SafeOperation hash must not be empty')
    }

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safe-operations/${safeOperationHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Create a new 4337 SafeOperation for a Safe.
   * @param addSafeOperationProps - The configuration of the SafeOperation
   * @throws "Safe address must not be empty"
   * @throws "Invalid Safe address {safeAddress}"
   * @throws "Module address must not be empty"
   * @throws "Invalid module address {moduleAddress}"
   * @throws "Signature must not be empty"
   */
  async addSafeOperation(safeOperation: AddSafeOperationProps | SafeOperation): Promise<void> {
    let safeAddress: string, moduleAddress: string
    let addSafeOperationProps: AddSafeOperationProps

    if (isSafeOperation(safeOperation)) {
      addSafeOperationProps = await getAddSafeOperationProps(safeOperation)
    } else {
      addSafeOperationProps = safeOperation
    }

    const {
      entryPoint,
      moduleAddress: moduleAddressProp,
      options,
      safeAddress: safeAddressProp,
      userOperation
    } = addSafeOperationProps
    if (!safeAddressProp) {
      throw new Error('Safe address must not be empty')
    }
    try {
      safeAddress = this.#getEip3770Address(safeAddressProp).address
    } catch (err) {
      throw new Error(`Invalid Safe address ${safeAddressProp}`)
    }

    if (!moduleAddressProp) {
      throw new Error('Module address must not be empty')
    }

    try {
      moduleAddress = this.#getEip3770Address(moduleAddressProp).address
    } catch (err) {
      throw new Error(`Invalid module address ${moduleAddressProp}`)
    }

    if (isEmptyData(userOperation.signature)) {
      throw new Error('Signature must not be empty')
    }

    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/safe-operations/`,
      method: HttpMethod.Post,
      body: {
        nonce: Number(userOperation.nonce),
        initCode: isEmptyData(userOperation.initCode) ? null : userOperation.initCode,
        callData: userOperation.callData,
        callGasLimit: userOperation.callGasLimit.toString(),
        verificationGasLimit: userOperation.verificationGasLimit.toString(),
        preVerificationGas: userOperation.preVerificationGas.toString(),
        maxFeePerGas: userOperation.maxFeePerGas.toString(),
        maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
        paymasterAndData: isEmptyData(userOperation.paymasterAndData)
          ? null
          : userOperation.paymasterAndData,
        entryPoint,
        validAfter: !options?.validAfter ? null : options?.validAfter,
        validUntil: !options?.validUntil ? null : options?.validUntil,
        signature: userOperation.signature,
        moduleAddress
      }
    })
  }
}

export default SafeApiKit
