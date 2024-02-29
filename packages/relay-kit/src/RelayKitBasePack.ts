import Safe from '@safe-global/protocol-kit'

type RelayKitBasePackTypes = {
  EstimateFeeOptions?: unknown
  EstimateFeeResult?: unknown
  CreateTransactionOptions?: unknown
  CreateTransactionResult?: unknown
  ExecuteTransactionOptions?: unknown
  ExecuteTransactionResult?: unknown
}

/**
 * Abstract class. The base class for all RelayKit packs.
 * It provides the Safe SDK instance and the abstract methods to be implemented by the packs.
 * @abstract
 * @template EstimateFeeOptions
 * @template EstimateFeeResult
 * @template CreateTransactionOptions
 * @template CreateTransactionResult,
 * @template ExecuteTransactionOptions
 * @template ExecuteTransactionResult
 */
export abstract class RelayKitBasePack<
  T extends Partial<RelayKitBasePackTypes> = Record<string, unknown>
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
   * @param {EstimateFeeOptions} options - The options for fee estimation.
   * @returns Promise<EstimateFeeResult> - The estimated fee result.
   */
  abstract getEstimateFee(options: T['EstimateFeeOptions']): Promise<T['EstimateFeeResult']>

  /**
   * Abstract function to create a Safe transaction, designed to be executed using the relayer.
   * @abstract
   * @param {CreateTransactionOptions} options - The options for transaction creation.
   * @returns Promise<CreateTransactionResult> - The output of the created transaction.
   */
  abstract createTransaction(
    options: T['CreateTransactionOptions']
  ): Promise<T['CreateTransactionResult']>

  /**
   * Abstract function to execute a Safe transaction using a relayer.
   * @abstract
   * @param {CreateTransactionResult} executable - The result of the created transaction. This can be for example a SafeTransaction object or SafeOperation.
   * @param {CreateTransactionOptions} options - The options for transaction execution.
   * @returns {Promise<ExecuteTransactionResult>} - Relay's response after executing the transaction.
   */
  abstract executeTransaction(
    executable: T['CreateTransactionResult'],
    options: T['ExecuteTransactionOptions']
  ): Promise<T['ExecuteTransactionResult']>
}
