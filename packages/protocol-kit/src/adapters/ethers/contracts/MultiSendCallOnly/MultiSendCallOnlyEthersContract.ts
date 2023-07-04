import {
  Multi_send_call_only as MultiSendCallOnly_V1_3_0,
  Multi_send_call_onlyInterface as MultiSendCallOnlyInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Multi_send_call_only'
import { Multi_send_call_only as MultiSendCallOnly_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Multi_send_call_only'
import { MultiSendCallOnlyContract } from '@safe-global/safe-core-sdk-types'

abstract class MultiSendCallOnlyEthersContract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_V1_4_1 | MultiSendCallOnly_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendCallOnlyInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendCallOnlyEthersContract
