import { Sign_message_lib__factory as SignMessageLib_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Sign_message_lib__factory as SignMessageLib_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import {
  SignMessageLibContract,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'
import { Hash, Hex } from 'viem'

type SignMessageLibAbi =
  | typeof SignMessageLib_V1_3_0__factory.abi
  | typeof SignMessageLib_V1_4_1__factory.abi

abstract class SignMessageLibViemContract
  extends ViemContract<SignMessageLibAbi>
  implements SignMessageLibContract
{
  constructor(args: ViemContractBaseArgs & { abi: SignMessageLibAbi }) {
    super(args)
  }

  async signMessage(data: string, options?: TransactionOptions): Promise<TransactionResult> {
    return this.writeContract('signMessage', [data], options)
  }

  async getMessageHash(message: Hex): Promise<Hash> {
    return this.readContract('getMessageHash', [message])
  }
}

export default SignMessageLibViemContract
