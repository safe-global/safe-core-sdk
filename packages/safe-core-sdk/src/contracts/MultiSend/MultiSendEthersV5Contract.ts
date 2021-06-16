import { MultiSend } from '../../../typechain/ethers-v5/MultiSend'
import MultiSendContract from './MultiSendContract'

class MultiSendEthersV5Contract implements MultiSendContract {
  constructor(public contract: MultiSend) {}

  getAddress(): string {
    return this.contract.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersV5Contract
