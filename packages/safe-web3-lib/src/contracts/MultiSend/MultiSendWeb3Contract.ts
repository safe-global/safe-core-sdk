import { MultiSendContract } from '@gnosis.pm/safe-core-sdk-types'
import { MultiSend as MultiSend_V1_1_1 } from '../../../typechain/src/web3-v1/v1.1.1/multi_send'
import { MultiSend as MultiSend_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/multi_send'

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
