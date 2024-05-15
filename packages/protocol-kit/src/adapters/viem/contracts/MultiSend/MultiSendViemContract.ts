import { Multi_send__factory as MultiSend_V1_1_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import { Multi_send__factory as MultiSend_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Multi_send__factory as MultiSend_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { MultiSendContract } from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type MultiSendAbi =
  | typeof MultiSend_V1_1_1__factory.abi
  | typeof MultiSend_V1_3_0__factory.abi
  | typeof MultiSend_V1_4_1__factory.abi

abstract class MultiSendViemContract
  extends ViemContract<MultiSendAbi>
  implements MultiSendContract
{
  constructor(args: ViemContractBaseArgs & { abi: MultiSendAbi }) {
    super(args)
  }
}

export default MultiSendViemContract
