import { Simulate_tx_accessor as SimulateTxAccessor } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Simulate_tx_accessor'
import SimulateTxAccessorWeb3Contract from '../SimulateTxAccessorWeb3Contract'

class SimulateTxAccessor_V1_4_1_Web3 extends SimulateTxAccessorWeb3Contract {
  constructor(public contract: SimulateTxAccessor) {
    super(contract)
  }
}

export default SimulateTxAccessor_V1_4_1_Web3
