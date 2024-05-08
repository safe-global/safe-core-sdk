import { isRestrictedAddress, sameString } from '@safe-global/protocol-kit/utils/address'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import {
  SafeContractImplementationType,
  SafeModulesPaginated
} from '@safe-global/protocol-kit/types'
import SafeProvider from '../SafeProvider'

class ModuleManager {
  #safeProvider: SafeProvider
  #safeContract?: SafeContractImplementationType

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
}

export default ModuleManager
