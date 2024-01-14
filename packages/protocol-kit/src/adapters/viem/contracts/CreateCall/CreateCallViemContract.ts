import { Create_call__factory as CreateCall_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Create_call__factory as CreateCall_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import {
  CreateCallContract,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type CreateCallAbi = typeof CreateCall_V1_3_0__factory.abi | typeof CreateCall_V1_4_1__factory.abi

abstract class CreateCallViemContract
  extends ViemContract<CreateCallAbi>
  implements CreateCallContract
{
  constructor(args: ViemContractBaseArgs & { abi: CreateCallAbi }) {
    super(args)
  }

  async performCreate2(
    value: string,
    deploymentData: string,
    salt: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    return this.writeContract('performCreate2', [value, deploymentData, salt], options)
  }

  async performCreate(
    value: string,
    deploymentData: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    return this.writeContract('performCreate', [value, deploymentData], options)
  }
}

export default CreateCallViemContract
