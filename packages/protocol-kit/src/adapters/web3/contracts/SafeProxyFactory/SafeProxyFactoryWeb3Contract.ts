import { Web3TransactionOptions } from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { SafeProxyFactoryContract } from '@safe-global/safe-core-sdk-types'
import { TransactionReceipt } from 'web3-core/types'

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: Web3TransactionOptions
  callback?: (txHash: string) => void
}

class SafeProxyFactoryWeb3Contract implements SafeProxyFactoryContract {
  constructor(public contract: any) {}

  getAddress(): Promise<string> {
    return Promise.resolve(this.contract.options.address)
  }

  async proxyCreationCode(): Promise<string> {
    return this.contract.methods.proxyCreationCode().call()
  }

  async createProxy({
    safeSingletonAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: CreateProxyProps): Promise<string> {
    if (BigInt(saltNonce) < 0) throw new Error('saltNonce must be greater than or equal to 0')
    if (options && !options.gas) {
      options.gas = await this.estimateGas(
        'createProxyWithNonce',
        [safeSingletonAddress, initializer, saltNonce],
        {
          ...options
        }
      )
    }
    const txResponse = this.contract.methods
      .createProxyWithNonce(safeSingletonAddress, initializer, saltNonce)
      .send(options)

    if (callback) {
      const txResult = await toTxResult(txResponse)
      callback(txResult.hash)
    }

    const txResult: TransactionReceipt = await new Promise((resolve, reject) =>
      txResponse.once('receipt', (receipt: TransactionReceipt) => resolve(receipt)).catch(reject)
    )
    const proxyAddress = txResult.events?.ProxyCreation?.returnValues?.proxy
    if (!proxyAddress) {
      throw new Error('SafeProxy was not deployed correctly')
    }
    return proxyAddress
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

export default SafeProxyFactoryWeb3Contract
