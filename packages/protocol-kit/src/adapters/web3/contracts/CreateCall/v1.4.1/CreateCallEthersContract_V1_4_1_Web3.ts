import { Create_call as CreateCall } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Create_call'
import CreateCallWeb3Contract from '../CreateCallWeb3Contract'

class CreateCallContract_V1_4_1_Web3 extends CreateCallWeb3Contract {
  constructor(public contract: CreateCall) {
    super(contract)
  }
}

export default CreateCallContract_V1_4_1_Web3
