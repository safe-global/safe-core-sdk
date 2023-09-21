import Safe from '@safe-global/protocol-kit'
import { MetaTransactionOptions, SafeTransaction } from '@safe-global/safe-core-sdk-types'

import { RelayKitTransaction } from './types'

export abstract class RelayKitBasePack {
  protocolKit: Safe

  /**
   * The packs implemented using our SDK should extend this class and therefore provide a Safe SDK instance
   * @constructor
   * @param protocolKit The Safe SDK instance
   */
  constructor(protocolKit: Safe) {
    this.protocolKit = protocolKit
  }

  /**
   * Get an estimation of the fee that will be paid for a transaction
   * @param chainId The chain id
   * @param gasLimit Max amount of gas willing to consume
   * @param gasToken Token address (or 0 if ETH) that is used for the payment
   */
  abstract getEstimateFee(chainId: number, gasLimit: string, gasToken?: string): Promise<string>

  /**
   * Creates a Safe transaction designed to be executed using the relayer.
   * @param {RelayKitTransaction} RelayKitTransaction - Properties required to create the transaction.
   * @returns {Promise<SafeTransaction>} - Returns a Promise that resolves with a SafeTransaction object.
   */
  abstract createRelayedTransaction({
    transactions,
    options,
    onlyCalls
  }: RelayKitTransaction): Promise<SafeTransaction>

  /**
   * Sends the Safe transaction to the relayer for execution.
   * If the Safe is not deployed, it creates a batch of transactions including the Safe deployment transaction.
   * @param {SafeTransaction} safeTransaction - The Safe transaction to be executed
   * @param {MetaTransactionOptions} options - The transaction options
   * @returns {Promise<RelayResponse>} Returns a Promise that resolves with a RelayResponse object.
   */
  abstract executeRelayTransaction(
    safeTransaction: SafeTransaction,
    options?: MetaTransactionOptions
  ): Promise<unknown>
}
