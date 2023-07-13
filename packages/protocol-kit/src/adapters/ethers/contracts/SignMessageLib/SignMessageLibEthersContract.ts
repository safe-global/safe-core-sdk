import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import {
  Sign_message_lib as SignMessageLib_V1_3_0,
  Sign_message_libInterface as SignMessageLibContractInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Sign_message_lib'
import { Sign_message_lib as SignMessageLib_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Sign_message_lib'
import { SignMessageLibContract } from '@safe-global/safe-core-sdk-types'

abstract class SignMessageLibEthersContract implements SignMessageLibContract {
  constructor(public contract: SignMessageLib_V1_4_1 | SignMessageLib_V1_3_0) {}

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
  ): Promise<string> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toString()
  }
}

export default SignMessageLibEthersContract
