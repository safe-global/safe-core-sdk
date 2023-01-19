import { SignMessageLibContract } from '@safe-global/safe-core-sdk-types'
import {
  Sign_message_lib as SignMessageLib_V1_3_0,
  Sign_message_libInterface as SignMessageLibContractInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/Sign_message_lib'
import { EthersTransactionOptions, EthersTransactionResult } from '../../types'
import { toTxResult } from '../../utils'

abstract class SignMessageLibEthersContract implements SignMessageLibContract {
  constructor(public contract: SignMessageLib_V1_3_0) {}

  getAddress(): string {
    return this.contract.address
  }

  async signMessage(
    data: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas('signMessage', [data], { ...options })
    }
    const txResponse = await this.contract.signMessage(data, options)
    return toTxResult(txResponse, options)
  }

  async getMessageHash(message: string): Promise<string> {
    return this.contract.getMessageHash(message)
  }

  encode: SignMessageLibContractInterface['encodeFunctionData'] = (
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

export default SignMessageLibEthersContract
