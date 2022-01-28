import { MultiSend } from '../../../../typechain/src/ethers-v5/v1.1.1/MultiSend'
import MultiSendEthersContract from '../MultiSendEthersContract'

class MultiSendContract_V1_1_1_Ethers extends MultiSendEthersContract {
  constructor(public contract: MultiSend) {
    super(contract)
  }
}

export default MultiSendContract_V1_1_1_Ethers
