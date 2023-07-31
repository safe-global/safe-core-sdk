import { BigNumber } from '@ethersproject/bignumber'
import {
  CallWithSyncFeeRequest,
  GelatoRelay as GelatoNetworkRelay,
  RelayRequestOptions,
  RelayResponse,
  SponsoredCallRequest,
  TransactionStatusResponse
} from '@gelatonetwork/relay-sdk'
import Safe, {
  estimateTxBaseGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  encodeTransferERC20Token
} from '@safe-global/protocol-kit'
import {
  GELATO_FEE_COLLECTOR,
  GELATO_NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/relay-kit/constants'
import { RelayPack, CreateTransactionProps } from '@safe-global/relay-kit/types'
import {
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction,
  EthAdapter
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
      false
    )
    return estimation.toString()
  }

  async getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined> {
    return this.#gelatoRelay.getTaskStatus(taskId)
  }

  /**
   * Creates a Safe transaction designed to be executed using the Gelato Relayer.
   *
   * @param {CreateTransactionProps} createTransactionProps - Properties required to create the transaction.
   * @returns {Promise<SafeTransaction>} Returns a Promise that resolves with a SafeTransaction object.
   */
  async createRelayedTransaction({
    safe,
    transactions,
    onlyCalls = false,
    options = {}
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const { isSponsored = false } = options
    const nonce = await safe.getNonce()

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

    // If the ERC20 gas token does not follow the standard 18 decimals, we cannot use handlePayment to pay Gelato fees.

    const gasToken = options.gasToken ?? ZERO_ADDRESS
    const isGasTokenCompatible = await isGasTokenCompatibleWithHandlePayment(gasToken, safe)

    if (isGasTokenCompatible) {
      // If the gas token is compatible, we use handlePayment to pay Gelato fees

      return this.createTransactionWithHandlePayment({ safe, transactions, onlyCalls, options })
    }

    // if the ERC20 gas token is not compatible (less than 18 decimals), a separate transfer is required to pay Gelato fees.

    return this.createTransactionWithTransfer({ safe, transactions, onlyCalls, options })
  }

  /**
   * Creates a Safe transaction designed to be executed using the Gelato Relayer and
   * uses the handlePayment function defined in the Safe contract to pay the fees
   * to the Gelato relayer.
   *
   * @async
   * @function createTransactionWithHandlePayment
   * @param {CreateTransactionProps} createTransactionProps - Properties needed to create the transaction.
   * @returns {Promise<SafeTransaction>} Returns a promise that resolves to the created SafeTransaction.
   */
  async createTransactionWithHandlePayment({
    safe,
    transactions,
    onlyCalls = false,
    options = {}
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const { gasLimit } = options
    const nonce = await safe.getNonce()

    // this transaction is only used for gas estimations
    const transactionToEstimateGas = await safe.createTransaction({
      safeTransactionData: transactions,
      onlyCalls,
      options: {
        nonce
      }
    })

    // as we set gasPrice to 1, we need to set the safeTxGas value see: https://github.com/safe-global/safe-contracts/blob/main/contracts/Safe.sol#L203
    const gasPrice = '1'
    const safeTxGas = await estimateSafeTxGas(safe, transactionToEstimateGas)
    const gasToken = options.gasToken ?? ZERO_ADDRESS
    const refundReceiver = this.getFeeCollector()
    const chainId = await safe.getChainId()

    // if a custom gasLimit is provided, we do not need to estimate the gas cost
    if (gasLimit) {
      const paymentToGelato = await this.getEstimateFee(chainId, gasLimit, gasToken)

      const syncTransaction = await safe.createTransaction({
        safeTransactionData: transactions,
        onlyCalls,
        options: {
          baseGas: paymentToGelato,
          gasPrice,
          safeTxGas,
          gasToken,
          refundReceiver,
          nonce
        }
      })

      return syncTransaction
    }

    // If gasLimit is not provided, we need to estimate the gas cost.

    const baseGas = await estimateTxBaseGas(safe, transactionToEstimateGas)
    const safeDeploymentGasCost = await estimateSafeDeploymentGas(safe)

    // see: https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters#optional-parameters
    const GELATO_GAS_EXECUTION_OVERHEAD = 150_000

    const totalGas =
      Number(baseGas) + // baseGas
      Number(safeTxGas) + // safeTxGas
      Number(safeDeploymentGasCost) + // Safe deploymet gas cost if it is required
      GELATO_GAS_EXECUTION_OVERHEAD // Gelato execution overhead

    const paymentToGelato = await this.getEstimateFee(chainId, String(totalGas), gasToken)

    const syncTransaction = await safe.createTransaction({
      safeTransactionData: transactions,
      onlyCalls,
      options: {
        baseGas: paymentToGelato, // payment to Gelato
        gasPrice,
        safeTxGas,
        gasToken,
        refundReceiver,
        nonce
      }
    })

    return syncTransaction
  }

  /**
   * Creates a Safe transaction designed to be executed using the Gelato Relayer and
   * uses a separate ERC20 transafer to pay the fees to the Gelato relayer.
   *
   * @async
   * @function createTransactionWithTransfer
   * @param {CreateTransactionProps} createTransactionProps - Properties needed to create the transaction.
   * @returns {Promise<SafeTransaction>} Returns a promise that resolves to the created SafeTransaction.
   */
  async createTransactionWithTransfer({
    safe,
    transactions,
    onlyCalls = false,
    options = {}
  }: CreateTransactionProps): Promise<SafeTransaction> {
    const { gasLimit } = options
    const nonce = await safe.getNonce()
    const gasToken = options.gasToken ?? ZERO_ADDRESS
    const chainId = await safe.getChainId()
    const gelatoAddress = this.getFeeCollector()

    // if a custom gasLimit is provided, we do not need to estimate the gas cost
    if (gasLimit) {
      const paymentToGelato = await this.getEstimateFee(chainId, gasLimit, gasToken)

      const transferToGelato = createERC20tokenTransferTransaction(
        gasToken,
        gelatoAddress,
        paymentToGelato
      )

      const syncTransaction = await safe.createTransaction({
        safeTransactionData: [...transactions, transferToGelato],
        onlyCalls,
        options: {
          nonce
        }
      })

      return syncTransaction
    }

    // If gasLimit is not provided, we need to estimate the gas cost.
    // To estimate the gas cost accurately, we first create an estimation without the Gelato payment.
    // After that, we re-estimate the gas cost including the Gelato payment.

    // this transaction is only used for gas estimations (without Gelato payment)
    const transactionToEstimateGas = await safe.createTransaction({
      safeTransactionData: transactions,
      onlyCalls,
      options: {
        nonce
      }
    })

    const safeTxGasWithoutPayment = await estimateSafeTxGas(safe, transactionToEstimateGas)
    const baseGas = await estimateTxBaseGas(safe, transactionToEstimateGas)
    const safeDeploymentGasCost = await estimateSafeDeploymentGas(safe)

    // see: https://docs.gelato.network/developer-services/relay/quick-start/optional-parameters#optional-parameters
    const GELATO_GAS_EXECUTION_OVERHEAD = 150_000

    const totalGasWithoutPayment =
      Number(baseGas) + // baseGas
      Number(safeTxGasWithoutPayment) + // safeTxGas without payment
      Number(safeDeploymentGasCost) + // Safe deploymet gas cost if it is required
      GELATO_GAS_EXECUTION_OVERHEAD // Gelato execution overhead

    const paymentToGelatoToEstimateGas = await this.getEstimateFee(
      chainId,
      String(totalGasWithoutPayment),
      gasToken
    )

    // This Gelato payment transaction is only used for gas estimations.
    const transferToGelatoToEstimateGas = createERC20tokenTransferTransaction(
      gasToken,
      gelatoAddress,
      paymentToGelatoToEstimateGas
    )

    // We can re-estimate the gas cost including the Gelato payment.

    // This transaction is only used for gas estimations (including the Gelato payment).
    const transactionWithPaymentToEstimateGas = await safe.createTransaction({
      safeTransactionData: [...transactions, transferToGelatoToEstimateGas],
      onlyCalls,
      options: {
        nonce
      }
    })

    const safeTxGas = await estimateSafeTxGas(safe, transactionWithPaymentToEstimateGas)

    const totalGas =
      Number(baseGas) + // baseGas
      Number(safeTxGas) + // safeTxGas with Gelato payment
      Number(safeDeploymentGasCost) + // Safe deploymet gas cost if it is required
      GELATO_GAS_EXECUTION_OVERHEAD // Gelato execution overhead

    const paymentToGelato = await this.getEstimateFee(chainId, String(totalGas), gasToken)

    const transferToGelato = createERC20tokenTransferTransaction(
      gasToken,
      gelatoAddress,
      paymentToGelato
    )

    const syncTransaction = await safe.createTransaction({
      safeTransactionData: [...transactions, transferToGelato],
      onlyCalls,
      options: {
        nonce,
        gasToken
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
    options = {}
  }: RelayTransaction): Promise<RelayResponse> {
    const response = options.isSponsored
      ? this.sendSponsorTransaction(target, encodedTransaction, chainId)
      : this.sendSyncTransaction(target, encodedTransaction, chainId, options)
    return response
  }

  /**
   * Sends the Safe transaction to the Gelato Relayer for execution.
   * If the Safe is not deployed, it creates a batch of transactions including the Safe deployment transaction.
   *
   * @param {SafeTransaction} safeTransaction - The Safe transaction to be executed.
   * @param {Safe} safe - The Safe object related to the transaction.
   * @returns {Promise<RelayResponse>} Returns a Promise that resolves with a RelayResponse object.
   */
  async executeRelayTransaction(
    safeTransaction: SafeTransaction,
    safe: Safe,
    options?: MetaTransactionOptions
  ): Promise<RelayResponse> {
    const isSafeDeployed = await safe.isSafeDeployed()
    const chainId = await safe.getChainId()
    const safeAddress = await safe.getAddress()
    const safeTransactionEncodedData = await safe.getEncodedTransaction(safeTransaction)

    const gasToken = options?.gasToken || safeTransaction.data.gasToken

    if (isSafeDeployed) {
      const relayTransaction: RelayTransaction = {
        target: safeAddress,
        encodedTransaction: safeTransactionEncodedData,
        chainId,
        options: {
          ...options,
          gasToken
        }
      }

      return this.relayTransaction(relayTransaction)
    }

    // if the Safe is not deployed we create a batch with the Safe deployment transaction and the provided Safe transaction
    const safeDeploymentBatch = await safe.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

    const relayTransaction: RelayTransaction = {
      target: safeDeploymentBatch.to, // multiSend Contract address
      encodedTransaction: safeDeploymentBatch.data,
      chainId,
      options: {
        ...options,
        gasToken
      }
    }

    return this.relayTransaction(relayTransaction)
  }
}

async function getERC20Decimals(tokenAddress: string, ethAdapter: EthAdapter): Promise<number> {
  const getTokenDecimalsTransaction = {
    to: tokenAddress,
    from: tokenAddress,
    value: '0',
    data: '0x313ce567' // decimals() ERC20 function encoded
  }

  const response = await ethAdapter.call(getTokenDecimalsTransaction)

  const decimals = Number(response)

  return decimals
}

const STANDARD_ERC20_DECIMALS = 18

async function isGasTokenCompatibleWithHandlePayment(gasToken: string, safe: Safe) {
  const ethAdapter = safe.getEthAdapter()
  const isNativeToken = gasToken === ZERO_ADDRESS

  if (isNativeToken) {
    return true
  }

  // Only ERC20 tokens with the standard 18 decimals are compatible
  const gasTokenDecimals = await getERC20Decimals(gasToken, ethAdapter)
  const isStandardERC20Token = gasTokenDecimals === STANDARD_ERC20_DECIMALS

  return isStandardERC20Token
}

function createERC20tokenTransferTransaction(
  tokenAddress: string,
  toAddress: string,
  amount: string
) {
  const transferTransaction = {
    to: tokenAddress,
    value: '0',
    data: encodeTransferERC20Token(toAddress, amount) as string
  }

  return transferTransaction
}
