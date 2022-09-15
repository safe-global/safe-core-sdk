import { Multi_send_call_only as MultiSendCallOnly } from '../../../../typechain/src/ethers-v5/v1.3.0/Multi_send_call_only'
import MultiSendCallOnlyEthersContract from '../MultiSendCallOnlyEthersContract'

class MultiSendCallOnlyContract_V1_3_0_Ethers extends MultiSendCallOnlyEthersContract {
  constructor(public contract: MultiSendCallOnly) {
    super(contract)
  }
}

export default MultiSendCallOnlyContract_V1_3_0_Ethers
