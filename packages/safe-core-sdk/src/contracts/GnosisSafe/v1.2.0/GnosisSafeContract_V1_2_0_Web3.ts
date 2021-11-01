import { GnosisSafe } from '../../../../typechain/src/web3-v1/v1.2.0/gnosis_safe'
import GnosisSafeContractWeb3 from '../GnosisSafeContractWeb3'

class GnosisSafeContract_V1_2_0_Web3 extends GnosisSafeContractWeb3 {
  constructor(public contract: GnosisSafe) {
    super(contract)
  }

  async getModules(): Promise<string[]> {
    return (super.contract as GnosisSafe).methods.getModules().call()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return (super.contract as GnosisSafe).methods.isModuleEnabled(moduleAddress).call()
  }
}

export default GnosisSafeContract_V1_2_0_Web3
