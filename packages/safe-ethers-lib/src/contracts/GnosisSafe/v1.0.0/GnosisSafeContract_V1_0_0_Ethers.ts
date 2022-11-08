import { Gnosis_safe as GnosisSafe } from '../../../../typechain/src/ethers-v5/v1.0.0/Gnosis_safe'
import { sameString } from '../../../utils'
import GnosisSafeContractEthers from '../GnosisSafeContractEthers'

class GnosisSafeContract_V1_0_0_Ethers extends GnosisSafeContractEthers {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    return this.contract.getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }
}

export default GnosisSafeContract_V1_0_0_Ethers
