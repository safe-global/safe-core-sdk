import Safe, {
  AddOwnerTxParams,
  RemoveOwnerTxParams,
  SwapOwnerTxParams
} from '@safe-global/protocol-kit'
import { BaseClient } from './BaseClient'
import SafeApiKit from 'packages/api-kit/dist/src'
import { ChangeThresholdTxParams } from './types'
import { TransactionBase } from 'packages/safe-core-sdk-types/dist/src'

export class SafeClient extends BaseClient {
  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    super(protocolKit, apiKit)
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
  async getOwnersWhoApprovedTx(txHash: string): Promise<string[]> {
    return this.protocolKit.getOwnersWhoApprovedTx(txHash)
  }

  /**
   * Encodes the data for adding a new owner to the Safe.
   *
   * @param {AddOwnerTxParams} params - The parameters for adding a new owner
   * @param {string} params.ownerAddress - The address of the owner to add
   * @param {number} params.threshold - The threshold of the Safe
   * @returns {TransactionBase} The encoded data
   */
  async createAddOwnerTx({ ownerAddress, threshold }: AddOwnerTxParams): Promise<TransactionBase> {
    const ownerManager = this.protocolKit.getOwnerManager()

    return {
      to: await this.protocolKit.getAddress(),
      value: '0',
      data: await ownerManager.encodeAddOwnerWithThresholdData(ownerAddress, threshold)
    }
  }

  /**
   * Encodes the data for removing an owner from the Safe.
   * @param {RemoveOwnerTxParams} params - The parameters for removing an owner
   * @param {string} params.ownerAddress - The address of the owner to remove
   * @param {number} params.threshold - The threshold of the Safe
   * @returns {TransactionBase} The encoded data
   */
  async createRemoveOwnerTx({
    ownerAddress,
    threshold
  }: RemoveOwnerTxParams): Promise<TransactionBase> {
    const ownerManager = this.protocolKit.getOwnerManager()
    return {
      to: await this.protocolKit.getAddress(),
      value: '0',
      data: await ownerManager.encodeRemoveOwnerData(ownerAddress, threshold)
    }
  }

  /**
   * Encodes the data for swapping an owner in the Safe.
   *
   * @param {SwapOwnerTxParams} params - The parameters for swapping an owner
   * @param {string} params.oldOwnerAddress - The address of the old owner
   * @param {string} params.newOwnerAddress - The address of the new owner
   * @returns {TransactionBase} The encoded data
   */
  async createSwapOwnerTx({
    oldOwnerAddress,
    newOwnerAddress
  }: SwapOwnerTxParams): Promise<TransactionBase> {
    const ownerManager = this.protocolKit.getOwnerManager()

    return {
      to: await this.protocolKit.getAddress(),
      value: '0',
      data: await ownerManager.encodeSwapOwnerData(oldOwnerAddress, newOwnerAddress)
    }
  }

  /**
   *
   * @param {ChangeThresholdTxParams} params - The parameters for changing the Safe threshold
   * @param {number} params.threshold - The new threshold
   * @returns {TransactionBase} The encoded data
   */
  async createChangeThresholdTx({ threshold }: ChangeThresholdTxParams): Promise<TransactionBase> {
    const ownerManager = this.protocolKit.getOwnerManager()

    return {
      to: await this.protocolKit.getAddress(),
      value: '0',
      data: await ownerManager.encodeChangeThresholdData(threshold)
    }
  }

  /**
   * Extend the SafeClient with additional functionality.
   *
   * @param extendFunc
   * @returns
   */
  extend<T>(extendFunc: (client: SafeClient) => Promise<T>): Promise<SafeClient & T>
  extend<T>(extendFunc: (client: SafeClient) => T): BaseClient & T

  extend<T>(
    extendFunc: (client: SafeClient) => T | Promise<T>
  ): (SafeClient & T) | Promise<SafeClient & T> {
    const result = extendFunc(this)

    if (result instanceof Promise) {
      return result.then((extensions) => Object.assign(this, extensions) as SafeClient & T)
    } else {
      return Object.assign(this, result) as SafeClient & T
    }
  }
}
