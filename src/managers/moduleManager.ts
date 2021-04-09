import { GnosisSafe } from '../../typechain'
import { areAddressesEqual } from '../utils'
import { SENTINEL_MODULES, zeroAddress } from '../utils/constants'

class ModuleManager {
  #ethers: any
  #contract: GnosisSafe

  constructor(ethers: any, contract: GnosisSafe) {
    this.#ethers = ethers
    this.#contract = contract
  }

  async getModules(): Promise<string[]> {
    return this.#contract.getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.#contract.isModuleEnabled(moduleAddress)
  }

  async encodeEnableModuleData(moduleAddress: string): Promise<string> {
    const isValidAddress = this.#ethers.utils.isAddress(moduleAddress)
    if (!isValidAddress || moduleAddress === zeroAddress || moduleAddress === SENTINEL_MODULES) {
      throw new Error('Invalid module address provided')
    }
    const modules = await this.getModules()
    const moduleIndex = modules.findIndex((module: string) =>
      areAddressesEqual(module, moduleAddress)
    )
    if (moduleIndex >= 0) {
      throw new Error('Module provided is already enabled')
    }
    return this.#contract.interface.encodeFunctionData('enableModule', [moduleAddress])
  }

  async encodeDisableModuleData(moduleAddress: string): Promise<string> {
    const isValidAddress = this.#ethers.utils.isAddress(moduleAddress)
    if (!isValidAddress || moduleAddress === zeroAddress || moduleAddress === SENTINEL_MODULES) {
      throw new Error('Invalid module address provided')
    }
    const modules = await this.getModules()
    const moduleIndex = modules.findIndex((module: string) =>
      areAddressesEqual(module, moduleAddress)
    )
    if (moduleIndex < 0) {
      throw new Error('Module provided is not enabled already')
    }
    const prevModuleAddress = moduleIndex === 0 ? SENTINEL_MODULES : modules[moduleIndex - 1]
    return this.#contract.interface.encodeFunctionData('disableModule', [
      prevModuleAddress,
      moduleAddress
    ])
  }
}

export default ModuleManager
