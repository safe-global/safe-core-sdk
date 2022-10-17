import { CreateCallContract } from '@gnosis.pm/safe-core-sdk-types'
import { Create_call as CreateCall_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/Create_call'

abstract class CreateCallWeb3Contract implements CreateCallContract {
  constructor(public contract: CreateCall_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default CreateCallWeb3Contract
