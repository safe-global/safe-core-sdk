import { Multi_send_call_only as MultiSendCallOnly } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send_call_only'
import MultiSendCallOnlyWeb3Contract from '../MultiSendCallOnlyWeb3Contract'

class MultiSendCallOnlyContract_V1_3_0_Web3 extends MultiSendCallOnlyWeb3Contract {
  constructor(public contract: MultiSendCallOnly) {
    super(contract)
  }
}

export default MultiSendCallOnlyContract_V1_3_0_Web3
