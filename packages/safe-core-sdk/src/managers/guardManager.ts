import { EthAdapter, GnosisSafeContract } from '@safe-global/safe-core-sdk-types'
import { isZeroAddress, sameString } from '../utils'
import { ZERO_ADDRESS } from '../utils/constants'
import { FEATURES, hasFeature } from '../utils/safeVersions'

class GuardManager {
  #ethAdapter: EthAdapter
  #safeContract: GnosisSafeContract
  // keccak256("guard_manager.guard.address")
  #slot = '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'

  constructor(ethAdapter: EthAdapter, safeContract: GnosisSafeContract) {
    this.#ethAdapter = ethAdapter
    this.#safeContract = safeContract
  }

  private validateGuardAddress(guardAddress: string): void {
    const isValidAddress = this.#ethAdapter.isAddress(guardAddress)
    if (!isValidAddress || isZeroAddress(guardAddress)) {
      throw new Error('Invalid guard address provided')
    }
  }

  private validateGuardIsNotEnabled(currentGuard: string, newGuardAddress: string): void {
    if (sameString(currentGuard, newGuardAddress)) {
      throw new Error('Guard provided is already enabled')
    }
  }

  private validateGuardIsEnabled(guardAddress: string): void {
    if (isZeroAddress(guardAddress)) {
      throw new Error('There is no guard enabled yet')
    }
  }

  async getGuard(): Promise<string> {
    const safeVersion = await this.#safeContract.getVersion()
    if (hasFeature(FEATURES.SAFE_TX_GUARDS, safeVersion)) {
      return this.#ethAdapter.getStorageAt(this.#safeContract.getAddress(), this.#slot)
    } else {
      throw new Error(
        'Current version of the Safe does not support Safe transaction guards functionality'
      )
    }
  }

  async encodeEnableGuardData(guardAddress: string): Promise<string> {
    this.validateGuardAddress(guardAddress)
    const currentGuard = await this.getGuard()
    this.validateGuardIsNotEnabled(currentGuard, guardAddress)
    return this.#safeContract.encode('setGuard', [guardAddress])
  }

  async encodeDisableGuardData(): Promise<string> {
    const currentGuard = await this.getGuard()
    this.validateGuardIsEnabled(currentGuard)
    return this.#safeContract.encode('setGuard', [ZERO_ADDRESS])
  }
}

export default GuardManager
