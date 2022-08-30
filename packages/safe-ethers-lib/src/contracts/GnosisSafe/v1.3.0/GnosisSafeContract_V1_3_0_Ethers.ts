import { Gnosis_safe as GnosisSafe } from '../../../../typechain/src/ethers-v5/v1.3.0/Gnosis_safe'
import { SENTINEL_ADDRESS } from '../../../utils/constants'
import GnosisSafeContractEthers from '../GnosisSafeContractEthers'

class GnosisSafeContract_V1_3_0_Ethers extends GnosisSafeContractEthers {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    const { array } = await this.contract.getModulesPaginated(SENTINEL_ADDRESS, 10)
    return array
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.contract.isModuleEnabled(moduleAddress)
  }
}

export default GnosisSafeContract_V1_3_0_Ethers
