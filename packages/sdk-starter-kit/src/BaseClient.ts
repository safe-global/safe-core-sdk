import Safe, {
  AddOwnerTxParams,
  AddPasskeyOwnerTxParams,
  RemoveOwnerTxParams,
  RemovePasskeyOwnerTxParams,
  SwapOwnerTxParams
} from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { SafeTransaction, TransactionBase } from '@safe-global/types-kit'

import { ChangeThresholdTxParams } from './types'

export class BaseClient {
  protocolKit: Safe
  apiKit: SafeApiKit

  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    this.protocolKit = protocolKit
    this.apiKit = apiKit
  }

  /**
   * Returns the Safe address.
   *
   * @returns {string} The Safe address
   */
  async getAddress(): Promise<string> {
    return this.protocolKit.getAddress()
  }

  /**
   * Checks if the current Safe is deployed.
   *
   * @returns {boolean} if the Safe contract is deployed
   */
  async isDeployed(): Promise<boolean> {
    return this.protocolKit.isSafeDeployed()
  }

  /**
   * Checks if a specific address is an owner of the current Safe.
   *
   * @param {string} ownerAddress - The account address
   * @returns {boolean} TRUE if the account is an owner
   */
  async isOwner(ownerAddress: string): Promise<boolean> {
    return this.protocolKit.isOwner(ownerAddress)
  }

  /**
   * Returns the list of Safe owner accounts.
   *
   * @returns The list of owners
   */
  async getOwners(): Promise<string[]> {
    return this.protocolKit.getOwners()
  }

  /**
   * Returns the Safe threshold.
   *
   * @returns {number} The Safe threshold
   */
  async getThreshold(): Promise<number> {
    return this.protocolKit.getThreshold()
  }

  /**
   * Returns the Safe nonce.
   *
   * @returns {number} The Safe nonce
   */
  async getNonce(): Promise<number> {
    return this.protocolKit.getNonce()
  }

  /**
   * Returns a list of owners who have approved a specific Safe transaction.
   *
   * @param {string} txHash - The Safe transaction hash
   * @returns {string[]} The list of owners
   */
  async getOwnersWhoApprovedTransaction(txHash: string): Promise<string[]> {
    return this.protocolKit.getOwnersWhoApprovedTx(txHash)
  }

  /**
   * Encodes the data for adding a new owner to the Safe.
   *
   * @param {AddOwnerTxParams | AddPasskeyOwnerTxParams} addOwnerParams - The parameters for adding a new owner
   * @returns {TransactionBase} The encoded data
   */
  async createAddOwnerTransaction(
    addOwnerParams: AddOwnerTxParams | AddPasskeyOwnerTxParams
  ): Promise<TransactionBase> {
    const addOwnerTransaction = await this.protocolKit.createAddOwnerTx(addOwnerParams)

    return this.#buildTransaction(addOwnerTransaction)
  }

  /**
   * Encodes the data for removing an owner from the Safe.
   *
   * @param {RemoveOwnerTxParams | RemovePasskeyOwnerTxParams} removeOwnerParams - The parameters for removing an owner
   * @returns {TransactionBase} The encoded data
   */
  async createRemoveOwnerTransaction(
    removeOwnerParams: RemoveOwnerTxParams | RemovePasskeyOwnerTxParams
  ): Promise<TransactionBase> {
    const removeOwnerTransaction = await this.protocolKit.createRemoveOwnerTx(removeOwnerParams)

    return this.#buildTransaction(removeOwnerTransaction)
  }

  /**
   * Encodes the data for swapping an owner in the Safe.
   *
   * @param {SwapOwnerTxParams} swapParams - The parameters for swapping an owner
   * @returns {TransactionBase} The encoded data
   */
  async createSwapOwnerTransaction(swapParams: SwapOwnerTxParams): Promise<TransactionBase> {
    const swapOwnerTransaction = await this.protocolKit.createSwapOwnerTx(swapParams)

    return this.#buildTransaction(swapOwnerTransaction)
  }

  /**
   * Encodes the data for changing the Safe threshold.
   *
   * @param {ChangeThresholdTxParams} changeThresholdParams - The parameters for changing the Safe threshold
   * @returns {TransactionBase} The encoded data
   */
  async createChangeThresholdTransaction(
    changeThresholdParams: ChangeThresholdTxParams
  ): Promise<TransactionBase> {
    const changeThresholdTransaction = await this.protocolKit.createChangeThresholdTx(
      changeThresholdParams.threshold
    )

    return this.#buildTransaction(changeThresholdTransaction)
  }

  async #buildTransaction(safeTransaction: SafeTransaction): Promise<TransactionBase> {
    return {
      to: safeTransaction.data.to,
      value: safeTransaction.data.value,
      data: safeTransaction.data.data
    }
  }
}
