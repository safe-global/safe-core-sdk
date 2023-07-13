import { Multi_send_call_only as MultiSendCallOnly_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send_call_only'
import { Multi_send_call_only as MultiSendCallOnly_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Multi_send_call_only'
import { MultiSendCallOnlyContract } from '@safe-global/safe-core-sdk-types'

abstract class MultiSendCallOnlyWeb3Contract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_V1_4_1 | MultiSendCallOnly_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default MultiSendCallOnlyWeb3Contract
