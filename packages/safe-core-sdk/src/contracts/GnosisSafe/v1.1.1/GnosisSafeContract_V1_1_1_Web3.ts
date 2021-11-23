import { GnosisSafe } from '../../../../typechain/src/web3-v1/v1.1.1/gnosis_safe'
import { sameString } from '../../../utils'
import GnosisSafeContractWeb3 from '../GnosisSafeContractWeb3'

class GnosisSafeContract_V1_1_1_Web3 extends GnosisSafeContractWeb3 {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    return (super.contract as GnosisSafe).methods.getModules().call()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }
}

export default GnosisSafeContract_V1_1_1_Web3
