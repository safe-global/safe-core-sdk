import { createGelatoEvmRelayerClient, sponsored } from '@gelatocloud/gasless'
import { type Hex } from 'viem'
import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { SafeTransaction } from '@safe-global/types-kit'

import {
  GelatoCreateTransactionProps,
  GelatoExecuteTransactionProps,
  GelatoOptions,
  GelatoTaskStatus
} from './types'

export class GelatoRelayPack extends RelayKitBasePack<{
  CreateTransactionProps: GelatoCreateTransactionProps
  CreateTransactionResult: SafeTransaction
  ExecuteTransactionProps: GelatoExecuteTransactionProps
  ExecuteTransactionResult: string
}> {
  #relayer: ReturnType<typeof createGelatoEvmRelayerClient>

  constructor({ apiKey, protocolKit }: GelatoOptions) {
    super(protocolKit)
    this.#relayer = createGelatoEvmRelayerClient({ apiKey })
  }

  /**
   * Gets the status of a relayed transaction.
   * @param {string} taskId - The task ID returned by the relayer.
   * @returns {Promise<GelatoTaskStatus>} The status of the task.
   */
  async getTaskStatus(taskId: string): Promise<GelatoTaskStatus> {
    return this.#relayer.waitForStatus({ id: taskId })
  }

  /**
   * Creates a Safe transaction designed to be executed using the Gelato Relayer.
   *
   * @param {GelatoCreateTransactionProps} props - Options for creating the transaction.
   * @param {MetaTransactionData[]} props.transactions - The transactions batch.
   * @param {boolean} [props.onlyCalls=false] - If true, MultiSendCallOnly contract should be used.
   * @returns {Promise<SafeTransaction>} Returns a Promise that resolves with a SafeTransaction object.
   */
  async createTransaction({
    transactions,
    onlyCalls = false
  }: GelatoCreateTransactionProps): Promise<SafeTransaction> {
    const nonce = await this.protocolKit.getNonce()

    return this.protocolKit.createTransaction({
      transactions,
      onlyCalls,
      options: {
        nonce
      }
    })
  }

  /**
   * Sends a sponsored transaction to the Gelato Relayer.
   *
   * @param {string} target - The target contract address.
   * @param {string} encodedTransaction - The encoded transaction data.
   * @param {bigint} chainId - The chain ID.
   * @returns {Promise<string>} Returns a Promise that resolves with the task ID.
   */
  async sendSponsorTransaction(
    target: string,
    encodedTransaction: string,
    chainId: bigint
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `payment` is not yet in the @gelatocloud/gasless type definitions
    const taskId = await (this.#relayer.sendTransaction as (args: any) => Promise<string>)({
      chainId: Number(chainId),
      to: target,
      data: encodedTransaction as Hex,
      payment: sponsored()
    })

    return taskId
  }

  /**
   * Sends the Safe transaction to the Gelato Relayer for execution.
   * If the Safe is not deployed, it creates a batch of transactions including the Safe deployment transaction.
   *
   * @param {GelatoExecuteTransactionProps} props - Execution props.
   * @param {SafeTransaction} props.executable - The Safe transaction to be executed.
   * @returns {Promise<string>} Returns a Promise that resolves with the task ID.
   */
  async executeTransaction({
    executable: safeTransaction
  }: GelatoExecuteTransactionProps): Promise<string> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    const chainId = await this.protocolKit.getChainId()
    const safeAddress = await this.protocolKit.getAddress()
    const safeTransactionEncodedData = await this.protocolKit.getEncodedTransaction(safeTransaction)

    if (isSafeDeployed) {
      return this.sendSponsorTransaction(safeAddress, safeTransactionEncodedData, chainId)
    }

    // if the Safe is not deployed we create a batch with the Safe deployment transaction and the provided Safe transaction
    const safeDeploymentBatch =
      await this.protocolKit.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

    return this.sendSponsorTransaction(safeDeploymentBatch.to, safeDeploymentBatch.data, chainId)
  }
}
