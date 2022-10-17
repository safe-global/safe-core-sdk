import { CreateCallContract } from '@gnosis.pm/safe-core-sdk-types'
import {
  Create_call as CreateCall_V1_3_0,
  Create_callInterface as CreateCallContractInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/Create_call'

abstract class CreateCallEthersContract implements CreateCallContract {
  constructor(public contract: CreateCall_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: CreateCallContractInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default CreateCallEthersContract
