import { MultiSendContract } from '@gnosis.pm/safe-core-sdk-types'
import { Multi_send as MultiSend_V1_0_0 } from '../../../typechain/src/ethers-v5/v1.0.0/Multi_send'
import { Multi_send as MultiSend_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/Multi_send'
import {
  Multi_send as MultiSend_V1_3_0,
  Multi_sendInterface as MultiSendInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/Multi_send'

abstract class MultiSendEthersContract implements MultiSendContract {
  constructor(public contract: MultiSend_V1_3_0 | MultiSend_V1_1_1 | MultiSend_V1_0_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersContract
