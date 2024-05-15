import { Multi_send__factory as MultiSend__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import MultiSendViemContract from '../MultiSendViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class MultiSendContract_V1_3_0_Viem extends MultiSendViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: MultiSend__factory.abi })
  }
}

export default MultiSendContract_V1_3_0_Viem
