import { Sign_message_lib__factory as SignMessageLib__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import SignMessageLibViemContract from '../SignMessageLibViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class SignMessageLibContract_V1_4_1_Viem extends SignMessageLibViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: SignMessageLib__factory.abi })
  }
}

export default SignMessageLibContract_V1_4_1_Viem
