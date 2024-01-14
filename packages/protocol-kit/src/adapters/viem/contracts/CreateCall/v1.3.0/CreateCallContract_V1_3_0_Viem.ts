import { Create_call__factory as CreateCall__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import CreateCallViemContract from '../CreateCallViemContract'
import { ViemContractBaseArgs } from '../../../ViemContract'

class CreateCallContract_V1_3_0_Viem extends CreateCallViemContract {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: CreateCall__factory.abi })
  }
}

export default CreateCallContract_V1_3_0_Viem
