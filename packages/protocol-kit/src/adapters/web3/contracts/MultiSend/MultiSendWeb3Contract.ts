import { MultiSendContract } from '@safe-global/safe-core-sdk-types'
import { Multi_send as MultiSend_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.1.1/Multi_send'
import { Multi_send as MultiSend_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Multi_send'

abstract class MultiSendWeb3Contract implements MultiSendContract {
  constructor(public contract: MultiSend_V1_3_0 | MultiSend_V1_1_1) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default MultiSendWeb3Contract
