import { Multi_send_call_only__factory as MultiSendCallOnly__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import MultiSendCallOnlyViemContract from '../MultiSendCallOnlyViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class MultiSendCallOnlyContract_V1_3_0_Viem extends MultiSendCallOnlyViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: MultiSendCallOnly__factory.abi })
  }
}

export default MultiSendCallOnlyContract_V1_3_0_Viem
