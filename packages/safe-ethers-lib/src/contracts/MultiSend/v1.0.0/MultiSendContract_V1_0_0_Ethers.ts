import { Multi_send as MultiSend } from '../../../../typechain/src/ethers-v5/v1.0.0/Multi_send'
import MultiSendEthersContract from '../MultiSendEthersContract'

class MultiSendContract_V1_0_0_Ethers extends MultiSendEthersContract {
  constructor(public contract: MultiSend) {
    super(contract)
  }
}

export default MultiSendContract_V1_0_0_Ethers
