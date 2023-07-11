import { SimulateTxAccessorContract } from '@safe-global/safe-core-sdk-types'
import {
  Simulate_tx_accessor as SimulateTxAccessor_V1_3_0,
  Simulate_tx_accessorInterface as SimulateTxAccessorContractInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Simulate_tx_accessor'

abstract class SimulateTxAccessorEthersContract implements SimulateTxAccessorContract {
  constructor(public contract: SimulateTxAccessor_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: SimulateTxAccessorContractInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default SimulateTxAccessorEthersContract
