import { MultiSendCallOnlyContract } from '@gnosis.pm/safe-core-sdk-types'
import { MultiSendCallOnly as MultiSendCallOnly_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/multi_send_call_only'

abstract class MultiSendCallOnlyWeb3Contract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default MultiSendCallOnlyWeb3Contract
