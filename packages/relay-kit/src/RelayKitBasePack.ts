import Safe from '@safe-global/protocol-kit'

/**
 * Abstract class. The base class for all RelayKit packs.
 * It provides the Safe SDK instance and the abstract methods to be implemented by the packs.
 * @abstract
 * @template TEstimateFeeOptions
 * @template TEstimateFeeResult
 * @template TCreateTransactionOptions
 * @template TCreateTransactionResult,
 * @template TExecuteTransactionOptions
 * @template TExecuteTransactionResult
 */
export abstract class RelayKitBasePack<
  TEstimateFeeOptions,
  TEstimateFeeResult,
  TCreateTransactionOptions,
  TCreateTransactionResult,
  TExecuteTransactionOptions,
  TExecuteTransactionResult
> {
  /**
   * @type {Safe}
   */
  protocolKit: Safe

  /**
   * Creates a new RelayKitBasePack instance.
   * The packs implemented using our SDK should extend this class and therefore provide a Safe SDK instance
   * @param {Safe} protocolKit - The Safe SDK instance
   */
  constructor(protocolKit: Safe) {
    this.protocolKit = protocolKit
  }

  /**
   * Abstract function to get an estimate of the fee that will be paid for a transaction.
   * @abstract
   * @param {TEstimateFeeOptions} options - The options for fee estimation.
   * @returns Promise<TEstimateFeeResult> - The estimated fee result.
   */
  abstract getEstimateFee(options: TEstimateFeeOptions): Promise<TEstimateFeeResult>

  /**
   * Abstract function to create a Safe transaction, designed to be executed using the relayer.
   * @abstract
   * @param {TCreateTransactionOptions} options - The options for transaction creation.
   * @returns Promise<TCreateTransactionResult> - The output of the created transaction.
   */
  abstract createTransaction(options: TCreateTransactionOptions): Promise<TCreateTransactionResult>

  /**
   * Abstract function to execute a Safe transaction using a relayer.
   * @abstract
   * @param {TCreateTransactionResult} executable - The result of the created transaction. This can be for example a SafeTransaction object or SafeOperation.
   * @param {TCreateTransactionOptions} options - The options for transaction execution.
   * @returns {Promise<TExecuteTransactionResult>} - Relay's response after executing the transaction.
   */
  abstract executeTransaction(
    executable: TCreateTransactionResult,
    options: TExecuteTransactionOptions
  ): Promise<TExecuteTransactionResult>
}
