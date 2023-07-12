import { Simulate_tx_accessor as SimulateTxAccessor_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Simulate_tx_accessor'
import { Simulate_tx_accessor as SimulateTxAccessor_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Simulate_tx_accessor'
import { SimulateTxAccessorContract } from '@safe-global/safe-core-sdk-types'

abstract class SimulateTxAccessorWeb3Contract implements SimulateTxAccessorContract {
  constructor(public contract: SimulateTxAccessor_V1_4_1 | SimulateTxAccessor_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default SimulateTxAccessorWeb3Contract
