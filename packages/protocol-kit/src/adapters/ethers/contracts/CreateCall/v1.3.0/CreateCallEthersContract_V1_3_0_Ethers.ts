import { Create_call as CreateCall } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Create_call'
import CreateCallEthersContract from '../CreateCallEthersContract'

class CreateCallContract_V1_3_0_Ethers extends CreateCallEthersContract {
  constructor(public contract: CreateCall) {
    super(contract)
  }
}

export default CreateCallContract_V1_3_0_Ethers
