import {
  hasSafeFeature,
  isZeroAddress,
  SAFE_FEATURES,
  SafeContractCompatibleWithFallbackHandler,
  sameString
} from '@safe-global/protocol-kit/utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { asHex } from '@safe-global/protocol-kit/utils/types'
import { SafeContractImplementationType } from '@safe-global/protocol-kit/types'
import SafeProvider from '../SafeProvider'

class FallbackHandlerManager {
  #safeProvider: SafeProvider
  #safeContract?: SafeContractImplementationType
  // keccak256("fallback_manager.handler.address")
  #slot = '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5'

  constructor(safeProvider: SafeProvider, safeContract?: SafeContractImplementationType) {
    this.#safeProvider = safeProvider
    this.#safeContract = safeContract
  }

  private validateFallbackHandlerAddress(fallbackHandlerAddress: string): void {
    const isValidAddress = this.#safeProvider.isAddress(fallbackHandlerAddress)
    if (!isValidAddress || isZeroAddress(fallbackHandlerAddress)) {
      throw new Error('Invalid fallback handler address provided')
    }
  }

  private validateFallbackHandlerIsNotEnabled(
    currentFallbackHandler: string,
    newFallbackHandlerAddress: string
  ): void {
    if (sameString(currentFallbackHandler, newFallbackHandlerAddress)) {
      throw new Error('Fallback handler provided is already enabled')
    }
  }

  private validateFallbackHandlerIsEnabled(fallbackHandlerAddress: string): void {
    if (isZeroAddress(fallbackHandlerAddress)) {
      throw new Error('There is no fallback handler enabled yet')
    }
  }

  private async isFallbackHandlerCompatible(): Promise<SafeContractCompatibleWithFallbackHandler> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }
    const safeVersion = await this.#safeContract.getVersion()
    if (!hasSafeFeature(SAFE_FEATURES.SAFE_FALLBACK_HANDLER, safeVersion)) {
      throw new Error(
        'Current version of the Safe does not support the fallback handler functionality'
      )
    }

    return this.#safeContract as SafeContractCompatibleWithFallbackHandler
  }

  async getFallbackHandler(): Promise<string> {
    const safeContract = await this.isFallbackHandlerCompatible()

    return this.#safeProvider.getStorageAt(safeContract.getAddress(), this.#slot)
  }

  async encodeEnableFallbackHandlerData(fallbackHandlerAddress: string): Promise<string> {
    const safeContract = await this.isFallbackHandlerCompatible()

    this.validateFallbackHandlerAddress(fallbackHandlerAddress)
    const currentFallbackHandler = await this.getFallbackHandler()
    this.validateFallbackHandlerIsNotEnabled(currentFallbackHandler, fallbackHandlerAddress)

    return safeContract.encode('setFallbackHandler', [asHex(fallbackHandlerAddress)])
  }

  async encodeDisableFallbackHandlerData(): Promise<string> {
    const safeContract = await this.isFallbackHandlerCompatible()

    const currentFallbackHandler = await this.getFallbackHandler()
    this.validateFallbackHandlerIsEnabled(currentFallbackHandler)

    return safeContract.encode('setFallbackHandler', [asHex(ZERO_ADDRESS)])
  }
}

export default FallbackHandlerManager
