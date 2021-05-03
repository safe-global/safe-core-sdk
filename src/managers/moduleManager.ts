import { GnosisSafe } from '../../typechain'
import { isRestrictedAddress, sameString } from '../utils'
import { SENTINEL_ADDRESS } from '../utils/constants'

class ModuleManager {
  #ethers: any
  #safeContract: GnosisSafe

  constructor(ethers: any, safeContract: GnosisSafe) {
    this.#ethers = ethers
    this.#safeContract = safeContract
  }

  private validateModuleAddress(moduleAddress: string): void {
    const isValidAddress = this.#ethers.utils.isAddress(moduleAddress)
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
      throw new Error('Module provided is not enabled already')
    }
    return moduleIndex
  }

  async getModules(): Promise<string[]> {
    return this.#safeContract.getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.#safeContract.isModuleEnabled(moduleAddress)
  }

  async encodeEnableModuleData(moduleAddress: string): Promise<string> {
    this.validateModuleAddress(moduleAddress)
    const modules = await this.getModules()
    this.validateModuleIsNotEnabled(moduleAddress, modules)
    return this.#safeContract.interface.encodeFunctionData('enableModule', [moduleAddress])
  }

  async encodeDisableModuleData(moduleAddress: string): Promise<string> {
    this.validateModuleAddress(moduleAddress)
    const modules = await this.getModules()
    const moduleIndex = this.validateModuleIsEnabled(moduleAddress, modules)
    const prevModuleAddress = moduleIndex === 0 ? SENTINEL_ADDRESS : modules[moduleIndex - 1]
    return this.#safeContract.interface.encodeFunctionData('disableModule', [
      prevModuleAddress,
      moduleAddress
    ])
  }
}

export default ModuleManager
