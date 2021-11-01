import { GnosisSafe } from '../../../../typechain/src/web3-v1/v1.3.0/gnosis_safe'
import { SENTINEL_ADDRESS } from '../../../utils/constants'
import GnosisSafeContractWeb3 from '../GnosisSafeContractWeb3'

class GnosisSafeContract_V1_3_0_Web3 extends GnosisSafeContractWeb3 {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    const asdf = (super.contract as GnosisSafe).methods
      .getModulesPaginated(SENTINEL_ADDRESS, 10)
      .call()
    console.log({ asdf })
    return ['']
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return (super.contract as GnosisSafe).methods.isModuleEnabled(moduleAddress).call()
  }
}

export default GnosisSafeContract_V1_3_0_Web3
