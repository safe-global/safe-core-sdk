import Safe from '@safe-global/protocol-kit'
import { RelayResponse } from '@gelatonetwork/relay-sdk'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'

import { CreateTransactionProps } from './types'

export abstract class RelayKitBasePack {
  safeSdk: Safe

  constructor(safeSdk: Safe) {
    this.safeSdk = safeSdk
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
   * @param {CreateTransactionProps} createTransactionProps - Properties required to create the transaction.
   * @returns {Promise<SafeTransaction>} - Returns a Promise that resolves with a SafeTransaction object.
   */
  abstract createRelayedTransaction({
    transactions,
    options,
    onlyCalls
  }: CreateTransactionProps): Promise<SafeTransaction>

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
  ): Promise<RelayResponse>
}
