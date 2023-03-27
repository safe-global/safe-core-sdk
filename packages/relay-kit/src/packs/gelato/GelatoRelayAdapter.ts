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
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'
import { GELATO_FEE_COLLECTOR, GELATO_NATIVE_TOKEN_ADDRESS, ZERO_ADDRESS } from '../../constants'
import { RelayAdapter } from '../../types'

export class GelatoRelayAdapter implements RelayAdapter {
  #gelatoRelay: GelatoNetworkRelay
  #apiKey?: string

  constructor(apiKey?: string) {
    this.#gelatoRelay = new GelatoNetworkRelay()
    this.#apiKey = apiKey
  }

  private _getFeeToken(gasToken?: string): string {
    return !gasToken || gasToken === ZERO_ADDRESS ? GELATO_NATIVE_TOKEN_ADDRESS : gasToken
  }

  // TODO: Should be moved to the protocol-kit
  private async _getSafeNonce(safe: Safe): Promise<number> {
    try {
      return await safe.getNonce()
    } catch {
      return 0
    }
  }

  getFeeCollector(): string {
    return GELATO_FEE_COLLECTOR
  }

  async getEstimateFee(
    chainId: number,
    gasLimit: BigNumber,
    gasToken?: string
  ): Promise<BigNumber> {
    const feeToken = this._getFeeToken(gasToken)
    const estimation = await this.#gelatoRelay.getEstimatedFee(chainId, feeToken, gasLimit, true)
    return estimation
  }

  async getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined> {
    return await this.#gelatoRelay.getTaskStatus(taskId)
  }

  async createRelayedTransaction(
    safe: Safe,
    transactions: MetaTransactionData[],
    options: MetaTransactionOptions
  ): Promise<SafeTransaction> {
    const { gasLimit, gasToken, isSponsored } = options
    const chainId = await safe.getChainId()
    const estimation = await this.getEstimateFee(chainId, gasLimit, gasToken)
    const nonce = await this._getSafeNonce(safe)

    const relayedSafeTransaction = await safe.createTransaction({
      safeTransactionData: transactions,
      options: {
        baseGas: !isSponsored ? estimation.toNumber() : 0,
        gasPrice: !isSponsored ? 1 : 0,
        gasToken: gasToken ?? ZERO_ADDRESS,
        refundReceiver: !isSponsored ? this.getFeeCollector() : ZERO_ADDRESS,
        nonce
      }
    })
    return relayedSafeTransaction
  }

  async sponsorTransaction(
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

  async payTransaction(
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
      gasLimit: gasLimit && gasLimit.toString()
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
      ? this.sponsorTransaction(target, encodedTransaction, chainId)
      : this.payTransaction(target, encodedTransaction, chainId, options)
    return response
  }
}
