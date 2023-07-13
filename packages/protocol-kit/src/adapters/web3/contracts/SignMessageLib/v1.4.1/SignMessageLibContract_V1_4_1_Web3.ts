import { Sign_message_lib as SignMessageLib } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Sign_message_lib'
import SignMessageLibWeb3Contract from '../SignMessageLibWeb3Contract'

class SignMessageLibContract_V1_4_1_Web3 extends SignMessageLibWeb3Contract {
  constructor(public contract: SignMessageLib) {
    super(contract)
  }
}

export default SignMessageLibContract_V1_4_1_Web3
