import { Simulate_tx_accessor as SimulateTxAccessor } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Simulate_tx_accessor'
import SimulateTxAccessorWeb3Contract from '../SimulateTxAccessorWeb3Contract'

class SimulateTxAccessor_V1_3_0_Web3 extends SimulateTxAccessorWeb3Contract {
  constructor(public contract: SimulateTxAccessor) {
    super(contract)
  }
}

export default SimulateTxAccessor_V1_3_0_Web3
