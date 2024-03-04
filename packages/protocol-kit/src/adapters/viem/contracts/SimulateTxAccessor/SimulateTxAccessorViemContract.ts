import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Simulate_tx_accessor__factory as SimulateTxAccessor_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { SimulateTxAccessorContract } from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type SimulateTxAccessorAbi =
  | typeof SimulateTxAccessor_V1_3_0__factory.abi
  | typeof SimulateTxAccessor_V1_4_1__factory.abi

abstract class SimulateTxAccessorViemContract
  extends ViemContract<SimulateTxAccessorAbi>
  implements SimulateTxAccessorContract
{
  constructor(args: ViemContractBaseArgs & { abi: SimulateTxAccessorAbi }) {
    super(args)
  }
}

export default SimulateTxAccessorViemContract
