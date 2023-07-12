import { Multi_send_call_only as MultiSendCallOnly } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Multi_send_call_only'
import MultiSendCallOnlyEthersContract from '../MultiSendCallOnlyEthersContract'

class MultiSendCallOnlyContract_V1_4_1_Ethers extends MultiSendCallOnlyEthersContract {
  constructor(public contract: MultiSendCallOnly) {
    super(contract)
  }
}

export default MultiSendCallOnlyContract_V1_4_1_Ethers
