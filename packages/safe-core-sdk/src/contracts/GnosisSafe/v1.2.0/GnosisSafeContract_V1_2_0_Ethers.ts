import { GnosisSafe } from '../../../../typechain/src/ethers-v5/v1.2.0/GnosisSafe'
import GnosisSafeContractEthers from '../GnosisSafeContractEthers'

class GnosisSafeContract_V1_2_0_Ethers extends GnosisSafeContractEthers {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    return (super.contract as GnosisSafe).getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return (super.contract as GnosisSafe).isModuleEnabled(moduleAddress)
  }
}

export default GnosisSafeContract_V1_2_0_Ethers
