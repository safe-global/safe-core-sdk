import { Gnosis_safe as GnosisSafe } from '../../../../typechain/src/web3-v1/v1.0.0/Gnosis_safe'
import { sameString } from '../../../utils'
import GnosisSafeContractWeb3 from '../GnosisSafeContractWeb3'

class GnosisSafeContract_V1_0_0_Web3 extends GnosisSafeContractWeb3 {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    return this.contract.methods.getModules().call()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }
}

export default GnosisSafeContract_V1_0_0_Web3
