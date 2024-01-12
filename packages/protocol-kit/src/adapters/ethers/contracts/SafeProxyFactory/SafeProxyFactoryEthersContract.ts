import { EventLog } from 'ethers'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import { Proxy_factory as SafeProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0/Proxy_factory'
import { Proxy_factory as SafeProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1/Proxy_factory'
import { SafeProxyFactoryContract } from '@safe-global/safe-core-sdk-types'

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: EthersTransactionOptions
  callback?: (txHash: string) => void
}

class SafeProxyFactoryEthersContract implements SafeProxyFactoryContract {
  constructor(public contract: SafeProxyFactory_V1_1_1 | SafeProxyFactory_V1_0_0) {}

  getAddress(): Promise<string> {
    return this.contract.getAddress()
  }

  async proxyCreationCode(): Promise<string> {
    return this.contract.proxyCreationCode()
  }

  async createProxy({
    safeSingletonAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: CreateProxyProps): Promise<string> {
    if (BigInt(saltNonce) < 0) throw new Error('saltNonce must be greater than or equal to 0')

    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas(
        'createProxyWithNonce',
        [safeSingletonAddress, initializer, saltNonce],
        {
          ...options
        }
      )
    }
    const proxyAddress = this.contract
      .createProxyWithNonce(safeSingletonAddress, initializer, saltNonce, { ...options })
      .then(async (txResponse) => {
        if (callback) {
          callback(txResponse.hash)
        }
        const txReceipt = await txResponse.wait()
        const events = txReceipt?.logs as EventLog[]
        const proxyCreationEvent = events.find((event) => event?.eventName === 'ProxyCreation')
        if (!proxyCreationEvent || !proxyCreationEvent.args) {
          throw new Error('SafeProxy was not deployed correctly')
        }
        const proxyAddress: string = proxyCreationEvent.args[0]
        return proxyAddress
      })
    return proxyAddress
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).interface.encodeFunctionData(methodName, params)
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: EthersTransactionOptions
  ): Promise<string> {
    const method = this.contract.getFunction(methodName)

    return (await method.estimateGas(...params, options)).toString()
  }
}

export default SafeProxyFactoryEthersContract
