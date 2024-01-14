import { Multi_send_call_only__factory as MultiSendCallOnly__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import MultiSendCallOnlyViemContract from '../MultiSendCallOnlyViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class MultiSendCallOnlyContract_V1_4_1_Viem extends MultiSendCallOnlyViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: MultiSendCallOnly__factory.abi })
  }
}

export default MultiSendCallOnlyContract_V1_4_1_Viem
