import { BigNumber } from '@ethersproject/bignumber'
import {
  CallWithSyncFeeRequest,
  GelatoRelay as GelatoNetworkRelay,
  RelayRequestOptions,
  RelayResponse,
  SponsoredCallRequest,
  TransactionStatusResponse
} from '@gelatonetwork/relay-sdk'
import Safe, { estimateTxBaseGas } from '@safe-global/protocol-kit'
import {
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'
import {
  GELATO_FEE_COLLECTOR,
  GELATO_NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/relay-kit/constants'
import { CreateTransactionProps, RelayAdapter } from '@safe-global/relay-kit/types'

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
    const estimation = await this.#gelatoRelay.getEstimatedFee(chainId, feeToken, gasLimit, false)
    return estimation
  }

  async getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined> {
    return this.#gelatoRelay.getTaskStatus(taskId)
  }

  async createRelayedTransaction({
    safe,
    transactions,
    onlyCalls = false,
    options = {}
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const { gasLimit, gasToken, isSponsored } = options
    const nonce = await this._getSafeNonce(safe)

    if (isSponsored) {
      const sponsoredTransaction = await safe.createTransaction({
        safeTransactionData: transactions,
        onlyCalls,
        options: {
          nonce
        }
      })

      return sponsoredTransaction
    }

    let estimateGas = gasLimit
    if (!estimateGas) {
      const estimateGasTx = await safe.createTransaction({
        safeTransactionData: transactions,
        onlyCalls,
        options: {
          gasPrice: 1,
          gasToken: gasToken ?? ZERO_ADDRESS,
          refundReceiver: this.getFeeCollector(),
          nonce
        }
      })

      const baseGas = await estimateTxBaseGas({
        safeContract: safe.getContractManager().safeContract,
        ...estimateGasTx.data
      })

      // https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters#optional-parameters
      const GELATO_GAS_EXECUTION_OVERHEAD = 150000
      estimateGas = BigNumber.from(
        Math.ceil(
          baseGas * 1.2 + GELATO_GAS_EXECUTION_OVERHEAD + estimateGasTx.data.safeTxGas * 1.2
        )
      )
    }

    console.log(`Estimated base gas ${estimateGas.toString()}`)
    const chainId = await safe.getChainId()
    const estimation = await this.getEstimateFee(chainId, BigNumber.from(estimateGas), gasToken)
    console.log(`Total fee estimation ${estimation}`)

    const syncTransaction = await safe.createTransaction({
      safeTransactionData: transactions,
      onlyCalls,
      options: {
        baseGas: estimation.toNumber(),
        gasPrice: 1,
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
      gasLimit: gasLimit && gasLimit.toString()
    }
    const response = await this.#gelatoRelay.callWithSyncFee(request, relayRequestOptions)
    return response
  }

  async relayTransaction({
    target,
    encodedTransaction,
    chainId,
    options = {}
  }: RelayTransaction): Promise<RelayResponse> {
    const response = options.isSponsored
      ? this.sendSponsorTransaction(target, encodedTransaction, chainId)
      : this.sendSyncTransaction(target, encodedTransaction, chainId, options)
    return response
  }
}
