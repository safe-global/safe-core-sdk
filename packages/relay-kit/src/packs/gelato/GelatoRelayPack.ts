import { BigNumber } from '@ethersproject/bignumber'
import {
  CallWithSyncFeeRequest,
  GelatoRelay as GelatoNetworkRelay,
  RelayRequestOptions,
  RelayResponse,
  SponsoredCallRequest,
  TransactionStatusResponse
} from '@gelatonetwork/relay-sdk'
import Safe from '@safe-global/protocol-kit'
import {
  GELATO_FEE_COLLECTOR,
  GELATO_NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/relay-kit/constants'
import { RelayPack } from '@safe-global/relay-kit/types'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'

export class GelatoRelayPack implements RelayPack {
  #gelatoRelay: GelatoNetworkRelay
  #apiKey?: string

  constructor(apiKey?: string) {
    this.#gelatoRelay = new GelatoNetworkRelay()
    this.#apiKey = apiKey
  }

  private _getFeeToken(gasToken?: string): string {
    return !gasToken || gasToken === ZERO_ADDRESS ? GELATO_NATIVE_TOKEN_ADDRESS : gasToken
  }

  getFeeCollector(): string {
    return GELATO_FEE_COLLECTOR
  }

  async getEstimateFee(chainId: number, gasLimit: string, gasToken?: string): Promise<string> {
    const feeToken = this._getFeeToken(gasToken)
    const estimation = await this.#gelatoRelay.getEstimatedFee(
      chainId,
      feeToken,
      BigNumber.from(gasLimit),
      true
    )
    return estimation.toString()
  }

  async getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined> {
    return this.#gelatoRelay.getTaskStatus(taskId)
  }

  async createRelayedTransaction(
    safe: Safe,
    transactions: MetaTransactionData[],
    options: MetaTransactionOptions
  ): Promise<SafeTransaction> {
    const { gasLimit, gasToken, isSponsored } = options
    const nonce = await safe.getNonce()

    if (isSponsored) {
      const sponsoredTransaction = await safe.createTransaction({
        safeTransactionData: transactions,
        options: {
          nonce
        }
      })

      return sponsoredTransaction
    }

    const chainId = await safe.getChainId()
    const estimation = await this.getEstimateFee(chainId, gasLimit, gasToken)

    const syncTransaction = await safe.createTransaction({
      safeTransactionData: transactions,
      options: {
        baseGas: estimation,
        gasPrice: '1',
        gasToken: gasToken ?? ZERO_ADDRESS,
        refundReceiver: this.getFeeCollector(),
        nonce
      }
    })
    return syncTransaction
  }

  async sendSponsorTransaction(
    target: string,
    encodedTransaction: string,
    chainId: number
  ): Promise<RelayResponse> {
    if (!this.#apiKey) {
      throw new Error('API key not defined')
    }
    const request: SponsoredCallRequest = {
      chainId,
      target,
      data: encodedTransaction
    }
    const response = await this.#gelatoRelay.sponsoredCall(request, this.#apiKey)
    return response
  }

  async sendSyncTransaction(
    target: string,
    encodedTransaction: string,
    chainId: number,
    options: MetaTransactionOptions
  ): Promise<RelayResponse> {
    const { gasLimit, gasToken } = options
    const feeToken = this._getFeeToken(gasToken)
    const request: CallWithSyncFeeRequest = {
      chainId,
      target,
      data: encodedTransaction,
      feeToken,
      isRelayContext: false
    }
    const relayRequestOptions: RelayRequestOptions = {
      gasLimit
    }
    const response = await this.#gelatoRelay.callWithSyncFee(request, relayRequestOptions)
    return response
  }

  async relayTransaction({
    target,
    encodedTransaction,
    chainId,
    options
  }: RelayTransaction): Promise<RelayResponse> {
    const response = options.isSponsored
      ? this.sendSponsorTransaction(target, encodedTransaction, chainId)
      : this.sendSyncTransaction(target, encodedTransaction, chainId, options)
    return response
  }
}
