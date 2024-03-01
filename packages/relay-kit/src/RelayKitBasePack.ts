import Safe from '@safe-global/protocol-kit'

type RelayKitBasePackTypes = {
  EstimateFeeProps?: unknown
  EstimateFeeResult?: unknown
  CreateTransactionProps?: unknown
  CreateTransactionResult?: unknown
  ExecuteTransactionProps?: unknown
  ExecuteTransactionResult?: unknown
}

/**
 * Abstract class. The base class for all RelayKit packs.
 * It provides the Safe SDK instance and the abstract methods to be implemented by the packs.
 * @abstract
 * @template EstimateFeeProps
 * @template EstimateFeeResult
 * @template CreateTransactionProps
 * @template CreateTransactionResult,
 * @template ExecuteTransactionProps
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
   * @param {EstimateFeeProps} props - The props for fee estimation.
   * @returns Promise<EstimateFeeResult> - The estimated fee result.
   */
  abstract getEstimateFee(props: T['EstimateFeeProps']): Promise<T['EstimateFeeResult']>

  /**
   * Abstract function to create a Safe transaction, designed to be executed using the relayer.
   * @abstract
   * @param {CreateTransactionProps} props - The props for transaction creation.
   * @returns Promise<CreateTransactionResult> - The output of the created transaction.
   */
  abstract createTransaction(
    props: T['CreateTransactionProps']
  ): Promise<T['CreateTransactionResult']>

  /**
   * Abstract function to execute a Safe transaction using a relayer.
   * @abstract
   * @param {CreateTransactionResult} executable - The result of the created transaction. This can be for example a SafeTransaction object or SafeOperation.
   * @param {CreateTransactionProps} props - The props for transaction execution.
   * @returns {Promise<ExecuteTransactionResult>} - Relay's response after executing the transaction.
   */
  abstract executeTransaction(
    executable: T['CreateTransactionResult'],
    props: T['ExecuteTransactionProps']
  ): Promise<T['ExecuteTransactionResult']>
}
