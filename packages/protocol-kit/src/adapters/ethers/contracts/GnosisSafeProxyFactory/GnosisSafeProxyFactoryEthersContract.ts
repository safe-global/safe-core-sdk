import { BigNumber } from '@ethersproject/bignumber'
import { Event } from '@ethersproject/contracts'
import { GnosisSafeProxyFactoryContract } from '@safe-global/safe-core-sdk-types'
import { Proxy_factory as ProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/Proxy_factory'
import { Proxy_factory as ProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/Proxy_factory'
import { Proxy_factory as ProxyFactory_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Proxy_factory'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'

export interface CreateProxyProps {
  safeMasterCopyAddress: string
  initializer: string
  saltNonce: string
  options?: EthersTransactionOptions
  callback?: (txHash: string) => void
}

class GnosisSafeProxyFactoryEthersContract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1 | ProxyFactory_V1_0_0) {}

  getAddress(): string {
    return this.contract.address
  }

  async proxyCreationCode(): Promise<string> {
    return this.contract.proxyCreationCode()
  }

  async createProxy({
    safeMasterCopyAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: CreateProxyProps): Promise<string> {
    if (BigNumber.from(saltNonce).lt(0))
      throw new Error('saltNonce must be greater than or equal to 0')
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas(
        'createProxyWithNonce',
        [safeMasterCopyAddress, initializer, saltNonce],
        {
          ...options
        }
      )
    }
    const proxyAddress = this.contract
      .createProxyWithNonce(safeMasterCopyAddress, initializer, saltNonce, options)
      .then(async (txResponse) => {
        if (callback) {
          callback(txResponse.hash)
        }
        const txReceipt = await txResponse.wait()
        const proxyCreationEvent = txReceipt?.events?.find(
          ({ event }: Event) => event === 'ProxyCreation'
        )
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
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toString()
  }
}

export default GnosisSafeProxyFactoryEthersContract
