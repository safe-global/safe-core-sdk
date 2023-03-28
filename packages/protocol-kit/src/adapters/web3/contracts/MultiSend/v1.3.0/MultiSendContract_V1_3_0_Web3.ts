import { Multi_send as MultiSend } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send'
import MultiSendWeb3Contract from '../MultiSendWeb3Contract'

class MultiSendContract_V1_3_0_Web3 extends MultiSendWeb3Contract {
  constructor(public contract: MultiSend) {
    super(contract)
  }
}

export default MultiSendContract_V1_3_0_Web3
