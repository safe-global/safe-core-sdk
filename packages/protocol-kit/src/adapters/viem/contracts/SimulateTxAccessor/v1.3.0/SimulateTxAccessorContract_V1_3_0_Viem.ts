import { Simulate_tx_accessor__factory as SimulateTxAccessor__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import SimulateTxAccessorViemContract from '../SimulateTxAccessorViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class SimulateTxAccessorContract_V1_3_0_Viem extends SimulateTxAccessorViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: SimulateTxAccessor__factory.abi })
  }
}

export default SimulateTxAccessorContract_V1_3_0_Viem
