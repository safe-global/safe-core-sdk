import { Sign_message_lib as SignMessageLib } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Sign_message_lib'
import SignMessageLibWeb3Contract from '../SignMessageLibWeb3Contract'

class SignMessageLibContract_V1_3_0_Web3 extends SignMessageLibWeb3Contract {
  constructor(public contract: SignMessageLib) {
    super(contract)
  }
}

export default SignMessageLibContract_V1_3_0_Web3
