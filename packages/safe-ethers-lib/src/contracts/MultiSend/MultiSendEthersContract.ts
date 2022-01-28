import { MultiSend as MultiSend_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/MultiSend'
import {
  MultiSend as MultiSend_V1_3_0,
  MultiSendInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/MultiSend'
import MultiSendContract from './MultiSendContract'

abstract class MultiSendEthersContract implements MultiSendContract {
  constructor(public contract: MultiSend_V1_1_1 | MultiSend_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersContract
