import { GnosisSafe } from '../../typechain'
import { areAddressesEqual } from '../utils'
import { SENTINEL_OWNERS, zeroAddress } from '../utils/constants'

class OwnerManager {
  #ethers: any
  #contract: GnosisSafe

  constructor(ethers: any, contract: GnosisSafe) {
    this.#ethers = ethers
    this.#contract = contract
  }

  async getOwners(): Promise<string[]> {
    return this.#contract.getOwners()
  }

  async getThreshold(): Promise<number> {
    return (await this.#contract.getThreshold()).toNumber()
  }

  async isOwner(ownerAddress: string): Promise<boolean> {
    return this.#contract.isOwner(ownerAddress)
  }

  async encodeAddOwnerWithThresholdData(ownerAddress: string, threshold?: number): Promise<string> {
    const isValidAddress = this.#ethers.utils.isAddress(ownerAddress)
    if (!isValidAddress || ownerAddress === zeroAddress || ownerAddress === SENTINEL_OWNERS) {
      throw new Error('Invalid owner address provided')
    }
    const owners = await this.getOwners()
    const addressIsOwner = owners.find((owner: string) => areAddressesEqual(owner, ownerAddress))
    if (addressIsOwner) {
      throw new Error('Address provided is already an owner')
    }
    const newThreshold = threshold ?? (await this.getThreshold())
    if (newThreshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (newThreshold > owners.length + 1) {
      throw new Error('Threshold cannot exceed owner count')
    }
    return this.#contract.interface.encodeFunctionData('addOwnerWithThreshold', [
      ownerAddress,
      newThreshold
    ])
  }

  async encodeRemoveOwnerData(ownerAddress: string, threshold?: number): Promise<string> {
    const isValidAddress = this.#ethers.utils.isAddress(ownerAddress)
    if (!isValidAddress || ownerAddress === zeroAddress || ownerAddress === SENTINEL_OWNERS) {
      throw new Error('Invalid owner address provided')
    }
    const owners = await this.getOwners()
    const ownerIndex = owners.findIndex((owner: string) => areAddressesEqual(owner, ownerAddress))
    const isOwner = ownerIndex >= 0
    if (!isOwner) {
      throw new Error('Address provided is not an owner')
    }
    const newThreshold = threshold ?? (await this.getThreshold()) - 1
    if (newThreshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (newThreshold > owners.length - 1) {
      throw new Error('Threshold cannot exceed owner count')
    }
    const prevOwnerAddress = ownerIndex === 0 ? SENTINEL_OWNERS : owners[ownerIndex - 1]
    return this.#contract.interface.encodeFunctionData('removeOwner', [
      prevOwnerAddress,
      ownerAddress,
      newThreshold
    ])
  }

  async encodeSwapOwnerData(oldOwnerAddress: string, newOwnerAddress: string): Promise<string> {
    const isValidOldAddress = this.#ethers.utils.isAddress(oldOwnerAddress)
    if (
      !isValidOldAddress ||
      oldOwnerAddress === zeroAddress ||
      oldOwnerAddress === SENTINEL_OWNERS
    ) {
      throw new Error('Invalid old owner address provided')
    }
    const isValidNewAddress = this.#ethers.utils.isAddress(newOwnerAddress)
    if (
      !isValidNewAddress ||
      newOwnerAddress === zeroAddress ||
      newOwnerAddress === SENTINEL_OWNERS
    ) {
      throw new Error('Invalid new owner address provided')
    }
    const owners = await this.getOwners()
    const isOwnerNewAddress = owners.find((owner: string) =>
      areAddressesEqual(owner, newOwnerAddress)
    )
    if (isOwnerNewAddress) {
      throw new Error('New address provided is already an owner')
    }
    const oldOwnerIndex = owners.findIndex((owner: string) =>
      areAddressesEqual(owner, oldOwnerAddress)
    )
    const isOwnerOldAddress = oldOwnerIndex >= 0
    if (!isOwnerOldAddress) {
      throw new Error('Old address provided is not an owner')
    }
    const prevOwnerAddress = oldOwnerIndex === 0 ? SENTINEL_OWNERS : owners[oldOwnerIndex - 1]
    return this.#contract.interface.encodeFunctionData('swapOwner', [
      prevOwnerAddress,
      oldOwnerAddress,
      newOwnerAddress
    ])
  }

  async encodeChangeThresholdData(threshold: number): Promise<string> {
    const owners = await this.getOwners()
    if (threshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (threshold > owners.length) {
      throw new Error('Threshold cannot exceed owner count')
    }
    return this.#contract.interface.encodeFunctionData('changeThreshold', [threshold])
  }
}

export default OwnerManager
