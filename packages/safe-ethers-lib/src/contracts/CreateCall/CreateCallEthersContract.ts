import { CreateCallContract } from '@gnosis.pm/safe-core-sdk-types'
import {
  Create_call as CreateCall_V1_3_0,
  Create_callInterface as CreateCallContractInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/Create_call'
import { EthersTransactionOptions, EthersTransactionResult } from '../../types'
import { toTxResult } from '../../utils'

abstract class CreateCallEthersContract implements CreateCallContract {
  constructor(public contract: CreateCall_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  async performCreate2(
    value: string,
    deploymentData: string,
    salt: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas('performCreate2', [value, deploymentData, salt], {
        ...options
      })
    }
    const txResponse = await this.contract.performCreate2(value, deploymentData, salt, options)
    return toTxResult(txResponse, options)
  }

  async performCreate(
    value: string,
    deploymentData: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas('performCreate', [value, deploymentData], {
        ...options
      })
    }
    const txResponse = await this.contract.performCreate(value, deploymentData, options)
    return toTxResult(txResponse, options)
  }

  encode: CreateCallContractInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: EthersTransactionOptions
  ): Promise<number> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toNumber()
  }
}

export default CreateCallEthersContract
