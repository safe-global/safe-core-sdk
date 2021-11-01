import { GnosisSafe } from '../../../../typechain/src/ethers-v5/v1.3.0/GnosisSafe'
import { SENTINEL_ADDRESS } from '../../../utils/constants'
import GnosisSafeContractEthers from '../GnosisSafeContractEthers'

class GnosisSafeContract_V1_3_0_Ethers extends GnosisSafeContractEthers {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    const asdf = (super.contract as GnosisSafe).getModulesPaginated(SENTINEL_ADDRESS, 10)
    console.log({ asdf })
    return ['']
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return (super.contract as GnosisSafe).isModuleEnabled(moduleAddress)
  }
}

export default GnosisSafeContract_V1_3_0_Ethers
