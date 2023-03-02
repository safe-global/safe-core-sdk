import { Signer } from '@ethersproject/abstract-signer'
import {
  EthAdapter,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionResponse
} from '@safe-global/safe-core-sdk-types'
import SafeTransactionService from './SafeTransactionService'
import {
  AllTransactionsListResponse,
  AllTransactionsOptions,
  MasterCopyResponse,
  ModulesResponse,
  OwnerResponse,
  ProposeTransactionProps,
  SafeBalanceResponse,
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeBalanceUsdResponse,
  SafeCollectibleListResponse,
  SafeCollectiblesOptions,
  SafeCreationInfoResponse,
  SafeDelegate,
  SafeDelegateConfig,
  SafeDelegateDeleteConfig,
  SafeDelegateListResponse,
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
} from './types/safeTransactionServiceTypes'
import { getTxServiceBaseUrl } from './utils'
import { HttpMethod, sendRequest } from './utils/httpRequests'

export interface SafeServiceClientConfig {
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl: string
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
}

class SafeServiceClient implements SafeTransactionService {
  #txServiceBaseUrl: string
  #ethAdapter: EthAdapter

  constructor({ txServiceUrl, ethAdapter }: SafeServiceClientConfig) {
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
   * Returns the list of delegates for a given Safe address.
   *
   * @param safeAddress - The Safe address
   * @returns The list of delegates
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/delegates/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a new delegate for a given Safe address.
   *
   * @param delegateConfig - The configuration of the new delegate
   * @returns
   * @throws "Invalid Safe address"
   * @throws "Invalid Safe delegate address"
   * @throws "Checksum address validation failed"
   * @throws "Address <delegate_address> is not checksumed"
   * @throws "Safe=<safe_address> does not exist or it's still not indexed"
   * @throws "Signing owner is not an owner of the Safe"
   */
  async addSafeDelegate({
    safe,
    delegate,
    label,
    signer
  }: SafeDelegateConfig): Promise<SafeDelegate> {
    if (safe === '') {
      throw new Error('Invalid Safe address')
    }
    if (delegate === '') {
      throw new Error('Invalid Safe delegate address')
    }
    const { address: safeAddress } = await this.#ethAdapter.getEip3770Address(safe)
    const { address: delegateAddress } = await this.#ethAdapter.getEip3770Address(delegate)
    const totp = Math.floor(Date.now() / 1000 / 3600)
    const data = delegateAddress + totp
    const signature = await signer.signMessage(data)
    const body: SafeDelegate = {
      safe: safeAddress,
      delegate: delegateAddress,
      label,
      signature
    }
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/delegates/`,
      method: HttpMethod.Post,
      body
    })
  }

  /**
   * Removes all delegates for a given Safe address.
   *
   * @param safeAddress - The Safe address
   * @param signer - A Signer that owns the Safe
   * @returns
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   * @throws "Safe=<safe_address> does not exist or it's still not indexed"
   * @throws "Signing owner is not an owner of the Safe"
   */
  async removeAllSafeDelegates(safeAddress: string, signer: Signer): Promise<void> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const totp = Math.floor(Date.now() / 1000 / 3600)
    const data = address + totp
    const signature = await signer.signMessage(data)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/delegates/`,
      method: HttpMethod.Delete,
      body: { signature }
    })
  }

  /**
   * Removes a delegate for a given Safe address.
   *
   * @param delegateConfig - The configuration for the delegate that will be removed
   * @returns
   * @throws "Invalid Safe address"
   * @throws "Invalid Safe delegate address"
   * @throws "Checksum address validation failed"
   * @throws "Signing owner is not an owner of the Safe"
   * @throws "Not found"
   */
  async removeSafeDelegate({ safe, delegate, signer }: SafeDelegateDeleteConfig): Promise<void> {
    if (safe === '') {
      throw new Error('Invalid Safe address')
    }
    if (delegate === '') {
      throw new Error('Invalid Safe delegate address')
    }
    const { address: safeAddress } = await this.#ethAdapter.getEip3770Address(safe)
    const { address: delegateAddress } = await this.#ethAdapter.getEip3770Address(delegate)
    const totp = Math.floor(Date.now() / 1000 / 3600)
    const data = delegateAddress + totp
    const signature = await signer.signMessage(data)
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/delegates/${delegateAddress}`,
      method: HttpMethod.Delete,
      body: {
        safe: safeAddress,
        delegate: delegateAddress,
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
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/incoming-transfers/`,
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
   * Returns the balances for Ether and ERC20 tokens of a Safe.
   *
   * @param safeAddress - The Safe address
   * @param options - API params
   * @returns The balances for Ether and ERC20 tokens
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getBalances(
    safeAddress: string,
    options?: SafeBalancesOptions
  ): Promise<SafeBalanceResponse[]> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/balances/`)
    const excludeSpam = options?.excludeSpamTokens?.toString() || 'true'
    url.searchParams.set('exclude_spam', excludeSpam)

    return sendRequest({ url: url.toString(), method: HttpMethod.Get })
  }

  /**
   * Returns the balances for Ether and ERC20 tokens of a Safe with USD fiat conversion.
   *
   * @param safeAddress - The Safe address
   * @param options - API params
   * @returns The balances for Ether and ERC20 tokens with USD fiat conversion
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getUsdBalances(
    safeAddress: string,
    options?: SafeBalancesUsdOptions
  ): Promise<SafeBalanceUsdResponse[]> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/balances/usd/`)
    const excludeSpam = options?.excludeSpamTokens?.toString() || 'true'
    url.searchParams.set('exclude_spam', excludeSpam)

    return sendRequest({ url: url.toString(), method: HttpMethod.Get })
  }

  /**
   * Returns the collectibles (ERC721 tokens) owned by the given Safe and information about them.
   *
   * @param {string} safeAddress - The Safe address
   * @param {Object} options - API params
   * @param {number} options.limit
   * @param {number} options.offset
   * @param {boolean} options.excludeSpamTokens
   * @returns The collectibles owned by the given Safe
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getCollectibles(
    safeAddress: string,
    options?: SafeCollectiblesOptions
  ): Promise<SafeCollectibleListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = await this.#ethAdapter.getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v2/safes/${address}/collectibles/`)

    const limit = options?.limit?.toString() || '10'
    url.searchParams.set('limit', limit)

    const offset = options?.offset?.toString() || '0'
    url.searchParams.set('offset', offset)

    const excludeSpam = options?.excludeSpamTokens?.toString() || 'true'
    url.searchParams.set('exclude_spam', excludeSpam)

    return sendRequest({ url: url.toString(), method: HttpMethod.Get })
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

export default SafeServiceClient
