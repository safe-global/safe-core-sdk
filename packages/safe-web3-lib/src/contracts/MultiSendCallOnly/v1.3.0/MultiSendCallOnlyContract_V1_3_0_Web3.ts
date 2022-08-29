import { MultiSendCallOnly } from '../../../../typechain/src/web3-v1/v1.3.0/multi_send_call_only'
import MultiSendCallOnlyWeb3Contract from '../MultiSendCallOnlyWeb3Contract'

class MultiSendCallOnlyContract_V1_3_0_Web3 extends MultiSendCallOnlyWeb3Contract {
  constructor(public contract: MultiSendCallOnly) {
    super(contract)
  }
}

export default MultiSendCallOnlyContract_V1_3_0_Web3
