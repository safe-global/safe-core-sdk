import { MultiSendCallOnlyContract } from '@gnosis.pm/safe-core-sdk-types'
import {
  MultiSendCallOnly as MultiSendCallOnly_V1_3_0,
  MultiSendCallOnlyInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/MultiSendCallOnly'

abstract class MultiSendCallOnlyEthersContract implements MultiSendCallOnlyContract {
  constructor(public contract: MultiSendCallOnly_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendCallOnlyInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendCallOnlyEthersContract
