import {
  Simulate_tx_accessor as SimulateTxAccessor_V1_3_0,
  Simulate_tx_accessorInterface as SimulateTxAccessorInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Simulate_tx_accessor'
import { Simulate_tx_accessor as SimulateTxAccessor_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Simulate_tx_accessor'
import { SimulateTxAccessorContract } from '@safe-global/safe-core-sdk-types'

abstract class SimulateTxAccessorEthersContract implements SimulateTxAccessorContract {
  constructor(public contract: SimulateTxAccessor_V1_4_1 | SimulateTxAccessor_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: SimulateTxAccessorInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SimulateTxAccessorEthersContract
