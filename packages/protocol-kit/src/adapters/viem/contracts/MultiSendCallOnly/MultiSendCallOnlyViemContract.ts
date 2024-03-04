import { Multi_send_call_only__factory as MultiSendCallOnly_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Multi_send_call_only__factory as MultiSendCallOnly_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { MultiSendCallOnlyContract } from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type MultiSendCallOnlyAbi =
  | typeof MultiSendCallOnly_V1_3_0__factory.abi
  | typeof MultiSendCallOnly_V1_4_1__factory.abi

abstract class MultiSendCallOnlyViemContract
  extends ViemContract<MultiSendCallOnlyAbi>
  implements MultiSendCallOnlyContract
{
  constructor(args: ViemContractBaseArgs & { abi: MultiSendCallOnlyAbi }) {
    super(args)
  }
}

export default MultiSendCallOnlyViemContract
