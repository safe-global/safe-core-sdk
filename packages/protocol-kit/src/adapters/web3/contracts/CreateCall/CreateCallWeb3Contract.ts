import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { Create_call as CreateCall_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Create_call'
import { Create_call as CreateCall_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Create_call'
import { CreateCallContract } from '@safe-global/safe-core-sdk-types'

abstract class CreateCallWeb3Contract implements CreateCallContract {
  constructor(public contract: CreateCall_V1_4_1 | CreateCall_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  async performCreate2(
    value: string,
    deploymentData: string,
    salt: string,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = await this.estimateGas('performCreate2', [value, deploymentData, salt], {
        ...options
      })
    }
    const txResponse = this.contract.methods
      .performCreate2(value, deploymentData, salt)
      .send(options)
    return toTxResult(txResponse, options)
  }

  async performCreate(
    value: string,
    deploymentData: string,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = await this.estimateGas('performCreate', [value, deploymentData], { ...options })
    }
    const txResponse = this.contract.methods.performCreate(value, deploymentData).send(options)
    return toTxResult(txResponse, options)
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: Web3TransactionOptions
  ): Promise<string> {
    return (
      await (this.contract.methods as any)[methodName](...params).estimateGas(options)
    ).toString()
  }
}

export default CreateCallWeb3Contract
