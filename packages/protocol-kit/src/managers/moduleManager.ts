import {
  isRestrictedAddress,
  sameString,
  hasSafeFeature,
  isZeroAddress,
  SAFE_FEATURES,
  SafeContractCompatibleWithModuleGuardManager
} from '@safe-global/protocol-kit/utils'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { asHex } from '@safe-global/protocol-kit/utils/types'
import {
  SafeContractImplementationType,
  SafeModulesPaginated
} from '@safe-global/protocol-kit/types'
import SafeProvider from '../SafeProvider'

class ModuleManager {
  #safeProvider: SafeProvider
  #safeContract?: SafeContractImplementationType
  // keccak256("module_manager.module_guard.address")
  #moduleGuardSlot = '0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947'

  constructor(safeProvider: SafeProvider, safeContract?: SafeContractImplementationType) {
    this.#safeProvider = safeProvider
    this.#safeContract = safeContract
  }

  private validateModuleAddress(moduleAddress: string): void {
    const isValidAddress = this.#safeProvider.isAddress(moduleAddress)
    if (!isValidAddress || isRestrictedAddress(moduleAddress)) {
      throw new Error('Invalid module address provided')
    }
  }

  private validateModuleIsNotEnabled(moduleAddress: string, modules: string[]): void {
    const moduleIndex = modules.findIndex((module: string) => sameString(module, moduleAddress))
    const isEnabled = moduleIndex >= 0
    if (isEnabled) {
      throw new Error('Module provided is already enabled')
    }
  }

  private validateModuleIsEnabled(moduleAddress: string, modules: string[]): number {
    const moduleIndex = modules.findIndex((module: string) => sameString(module, moduleAddress))
    const isEnabled = moduleIndex >= 0
    if (!isEnabled) {
      throw new Error('Module provided is not enabled yet')
    }
    return moduleIndex
  }

  async getModules(): Promise<string[]> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }

    const [modules] = await this.#safeContract.getModules()

    return [...modules]
  }

  async getModulesPaginated(start: string, pageSize: number): Promise<SafeModulesPaginated> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }

    const [modules, next] = await this.#safeContract.getModulesPaginated([start, BigInt(pageSize)])
    return { modules: modules as string[], next }
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }

    const [isModuleEnabled] = await this.#safeContract.isModuleEnabled([moduleAddress])

    return isModuleEnabled
  }

  async encodeEnableModuleData(moduleAddress: string): Promise<string> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }
    this.validateModuleAddress(moduleAddress)
    const modules = await this.getModules()
    this.validateModuleIsNotEnabled(moduleAddress, modules)
    return this.#safeContract.encode('enableModule', [moduleAddress])
  }

  async encodeDisableModuleData(moduleAddress: string): Promise<string> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }
    this.validateModuleAddress(moduleAddress)
    const modules = await this.getModules()
    const moduleIndex = this.validateModuleIsEnabled(moduleAddress, modules)
    const prevModuleAddress = moduleIndex === 0 ? SENTINEL_ADDRESS : modules[moduleIndex - 1]
    return this.#safeContract.encode('disableModule', [prevModuleAddress, moduleAddress])
  }

  private validateModuleGuardAddress(moduleGuardAddress: string): void {
    const isValidAddress = this.#safeProvider.isAddress(moduleGuardAddress)
    if (!isValidAddress || isZeroAddress(moduleGuardAddress)) {
      throw new Error('Invalid module guard address provided')
    }
  }

  private validateModuleGuardIsNotEnabled(
    currentModuleGuard: string,
    newModuleGuardAddress: string
  ): void {
    if (sameString(currentModuleGuard, newModuleGuardAddress)) {
      throw new Error('Module guard provided is already enabled')
    }
  }

  private validateModuleGuardIsEnabled(moduleGuardAddress: string): void {
    if (isZeroAddress(moduleGuardAddress)) {
      throw new Error('There is no module guard enabled yet')
    }
  }

  private async isModuleGuardCompatible(): Promise<SafeContractCompatibleWithModuleGuardManager> {
    if (!this.#safeContract) {
      throw new Error('Safe is not deployed')
    }
    const safeVersion = this.#safeContract.safeVersion
    if (!hasSafeFeature(SAFE_FEATURES.SAFE_MODULE_GUARD, safeVersion)) {
      throw new Error('Current version of the Safe does not support module guard functionality')
    }

    return this.#safeContract as SafeContractCompatibleWithModuleGuardManager
  }

  async getModuleGuard(): Promise<string> {
    const safeContract = await this.isModuleGuardCompatible()

    return this.#safeProvider.getStorageAt(safeContract.getAddress(), this.#moduleGuardSlot)
  }

  async encodeEnableModuleGuardData(moduleGuardAddress: string): Promise<string> {
    const safeContract = await this.isModuleGuardCompatible()

    this.validateModuleGuardAddress(moduleGuardAddress)
    const currentModuleGuard = await this.getModuleGuard()
    this.validateModuleGuardIsNotEnabled(currentModuleGuard, moduleGuardAddress)
    return safeContract.encode('setModuleGuard', [asHex(moduleGuardAddress)])
  }

  async encodeDisableModuleGuardData(): Promise<string> {
    const safeContract = await this.isModuleGuardCompatible()

    const currentModuleGuard = await this.getModuleGuard()
    this.validateModuleGuardIsEnabled(currentModuleGuard)
    return safeContract.encode('setModuleGuard', [asHex(ZERO_ADDRESS)])
  }
}

export default ModuleManager
