import { Simulate_tx_accessor as SimulateTxAccessor } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Simulate_tx_accessor'
import SimulateTxAccessorEthersContract from '../SimulateTxAccessorEthersContract'

class SimulateTxAccessorContract_V1_4_1_Ethers extends SimulateTxAccessorEthersContract {
  constructor(public contract: SimulateTxAccessor) {
    super(contract)
  }
}

export default SimulateTxAccessorContract_V1_4_1_Ethers
