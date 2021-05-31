import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import SafeTransactionService from './SafeTransactionService'
import {
  MasterCopyResponse,
  SafeBalanceResponse,
  SafeBalanceUsdResponse,
  SafeCollectibleResponse,
  SafeCreationInfoResponse,
  SafeDelegate,
  SafeDelegateDelete,
  SafeDelegateListResponse,
  SafeInfoResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
  SafeServiceInfoResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from './types/safeTransactionServiceTypes'
import { getTxServiceBaseUrl } from './utils'
import { HttpMethod, sendRequest } from './utils/httpRequests'

class SafeServiceClient implements SafeTransactionService {
  #txServiceBaseUrl: string

  constructor(txServiceUrl: string) {
    this.#txServiceBaseUrl = getTxServiceBaseUrl(txServiceUrl)
  }

  async getServiceInfo(): Promise<SafeServiceInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/about`,
      method: HttpMethod.Get
    })
  }

  async getServiceMasterCopiesInfo(): Promise<MasterCopyResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/about/master-copies`,
      method: HttpMethod.Get
    })
  }

  async decodeData(data: string): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/data-decoder/`,
      method: HttpMethod.Post,
      body: { data }
    })
  }

  async getSafesByOwner(ownerAddress: string): Promise<string[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/owners/${ownerAddress}/`,
      method: HttpMethod.Get
    })
  }

  async getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/`,
      method: HttpMethod.Get
    })
  }

  async getTransactionConfirmations(
    safeTxHash: string
  ): Promise<SafeMultisigConfirmationListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Get
    })
  }

  async confirmTransaction(safeTxHash: string, signature: string): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Post,
      body: {
        signature
      }
    })
  }

  async getSafeInfo(safeAddress: string): Promise<SafeInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/`,
      method: HttpMethod.Get
    })
  }

  async getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/`,
      method: HttpMethod.Get
    })
  }

  async addSafeDelegate(safeAddress: string, delegate: SafeDelegate): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/`,
      method: HttpMethod.Post,
      body: delegate
    })
  }

  async removeSafeDelegate(safeAddress: string, delegate: SafeDelegateDelete): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/${delegate.delegate}`,
      method: HttpMethod.Delete,
      body: delegate
    })
  }

  async getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/creation/`,
      method: HttpMethod.Get
    })
  }

  async estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/estimations/`,
      method: HttpMethod.Post,
      body: safeTransaction
    })
  }

  async proposeTransaction(
    safeAddress: string,
    transaction: SafeTransactionData,
    transactionHash: string,
    signature: SafeSignature
  ): Promise<string> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/`,
      method: HttpMethod.Post,
      body: {
        data: {
          ...transaction,
          contractTransactionHash: transactionHash,
          sender: signature.signer,
          signature: signature.data
        },
        safe: safeAddress
      }
    })
  }

  async getIncomingTransactions(safeAddress: string): Promise<TransferListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/incoming-transfers/`,
      method: HttpMethod.Get
    })
  }

  async getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/module-transfers/`,
      method: HttpMethod.Get
    })
  }

  async getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/`,
      method: HttpMethod.Get
    })
  }

  async getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse> {
    let nonce = currentNonce ? currentNonce : (await this.getSafeInfo(safeAddress)).nonce
    return sendRequest({
      url: `${
        this.#txServiceBaseUrl
      }/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${nonce}`,
      method: HttpMethod.Get
    })
  }

  async getBalances(safeAddress: string): Promise<SafeBalanceResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/balances/`,
      method: HttpMethod.Get
    })
  }

  async getUsdBalances(safeAddress: string): Promise<SafeBalanceUsdResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/balances/usd/`,
      method: HttpMethod.Get
    })
  }

  async getCollectibles(safeAddress: string): Promise<SafeCollectibleResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/collectibles/`,
      method: HttpMethod.Get
    })
  }

  async getTokens(): Promise<TokenInfoListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/`,
      method: HttpMethod.Get
    })
  }

  async getToken(tokenAddress: string): Promise<TokenInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/${tokenAddress}/`,
      method: HttpMethod.Get
    })
  }
}

export default SafeServiceClient
