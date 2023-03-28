import { Multi_send as MultiSend } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Multi_send'
import MultiSendEthersContract from '../MultiSendEthersContract'

class MultiSendContract_V1_3_0_Ethers extends MultiSendEthersContract {
  constructor(public contract: MultiSend) {
    super(contract)
  }
}

export default MultiSendContract_V1_3_0_Ethers
