import { MultiSend, MultiSendInterface } from '../../../typechain/src/ethers-v5/v1.3.0/MultiSend'
import MultiSendContract from './MultiSendContract'

class MultiSendEthersV5Contract implements MultiSendContract {
  constructor(public contract: MultiSend) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersV5Contract
