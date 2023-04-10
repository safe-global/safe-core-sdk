import {
  AddSafeDelegateProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DeleteSafeDelegateProps,
  GetSafeDelegateProps,
  MasterCopyResponse,
  ModulesResponse,
  OwnerResponse,
  ProposeTransactionProps,
  SafeCreationInfoResponse,
  SafeDelegateListResponse,
  SafeDelegateResponse,
  SafeInfoResponse,
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
import { getTxServiceBaseUrl } from '@safe-global/api-kit/utils'
import { HttpMethod, sendRequest } from '@safe-global/api-kit/utils/httpRequests'
import {
  EthAdapter,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionResponse
} from '@safe-global/safe-core-sdk-types'

export interface SafeApiKitConfig {
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl: string
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
}

class SafeApiKit {
  #txServiceBaseUrl: string
  #ethAdapter: EthAdapter

  constructor({ txServiceUrl, ethAdapter }: SafeApiKitConfig) {
    this.#txServiceBaseUrl = getTxServiceBaseUrl(txServiceUrl)
    this.#ethAdapter = ethAdapter
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
   * Returns the list of Safe master copies.
   *
   * @returns The list of Safe master copies
   */
  async getServiceMasterCopiesInfo(): Promise<MasterCopyResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/about/master-copies`,
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
    const { address } = await this.#ethAdapter.getEip3770Address(ownerAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(moduleAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const url = new URL(`${this.#txServiceBaseUrl}/v1/delegates`)

    if (safeAddress) {
      const { address: safe } = await this.#ethAdapter.getEip3770Address(safeAddress)
      url.searchParams.set('safe', safe)
    }
    if (delegateAddress) {
      const { address: delegate } = await this.#ethAdapter.getEip3770Address(delegateAddress)
      url.searchParams.set('delegate', delegate)
    }
    if (delegatorAddress) {
      const { address: delegator } = await this.#ethAdapter.getEip3770Address(delegatorAddress)
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
    const { address: delegate } = await this.#ethAdapter.getEip3770Address(delegateAddress)
    const { address: delegator } = await this.#ethAdapter.getEip3770Address(delegatorAddress)
    const totp = Math.floor(Date.now() / 1000 / 3600)
    const data = delegate + totp
    const signature = await signer.signMessage(data)
    const body: any = {
      safe: safeAddress ? (await this.#ethAdapter.getEip3770Address(safeAddress)).address : null,
      delegate,
      delegator,
      label,
      signature
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/delegates/`,
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
    const { address: delegate } = await this.#ethAdapter.getEip3770Address(delegateAddress)
    const { address: delegator } = await this.#ethAdapter.getEip3770Address(delegatorAddress)
    const totp = Math.floor(Date.now() / 1000 / 3600)
    const data = delegate + totp
    const signature = await signer.signMessage(data)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/delegates/${delegate}`,
      method: HttpMethod.Delete,
      body: {
        delegate,
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address: safe } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const { address: sender } = await this.#ethAdapter.getEip3770Address(senderAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const nonce = currentNonce ? currentNonce : (await this.getSafeInfo(address)).nonce
    return sendRequest({
      url: `${
        this.#txServiceBaseUrl
      }/v1/safes/${address}/multisig-transactions/?executed=false&nonce__gte=${nonce}`,
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
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
    const { address } = await this.#ethAdapter.getEip3770Address(tokenAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/tokens/${address}/`,
      method: HttpMethod.Get
    })
  }
}

export default SafeApiKit
