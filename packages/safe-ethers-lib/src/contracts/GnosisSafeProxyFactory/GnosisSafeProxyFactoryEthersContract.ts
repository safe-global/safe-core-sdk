import { Event } from '@ethersproject/contracts'
import { GnosisSafeProxyFactoryContract } from '@gnosis.pm/safe-core-sdk-types'
import { ProxyFactory as ProxyFactory_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/ProxyFactory'
import { ProxyFactory as ProxyFactory_V1_3_0 } from '../../../typechain/src/ethers-v5/v1.3.0/ProxyFactory'
import { EthersTransactionOptions } from '../../types'

export interface CreateProxyProps {
  safeMasterCopyAddress: string
  initializer: string
  saltNonce: number
  options?: EthersTransactionOptions
  callback?: (txHash: string) => void
}

class GnosisSafeProxyFactoryEthersContract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1) {}

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
    if (saltNonce < 0) {
      throw new Error('saltNonce must be greater than 0')
    }
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
          throw new Error('Safe Proxy was not deployed correctly')
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
  ): Promise<number> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toNumber()
  }
}

export default GnosisSafeProxyFactoryEthersContract
