import { CreateProxyProps, GnosisSafeProxyFactoryContract } from '@gnosis.pm/safe-core-sdk-types'
import { TransactionReceipt } from 'web3-core/types'
import { ProxyFactory as ProxyFactory_V1_1_1 } from '../../../typechain/src/web3-v1/v1.1.1/proxy_factory'
import { ProxyFactory as ProxyFactory_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/proxy_factory'

class GnosisSafeProxyFactoryWeb3Contract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1) {}

  getAddress(): string {
    return this.contract.options.address
  }

  async createProxy({
    safeMasterCopyAddress,
    initializer,
    saltNonce,
    options
  }: CreateProxyProps): Promise<string> {
    if (saltNonce < 0) {
      throw new Error('saltNonce must be greater than 0')
    }
    const tx = this.contract.methods.createProxyWithNonce(
      safeMasterCopyAddress,
      initializer,
      saltNonce
    )
    if (options && !options.gasLimit && !options.gas) {
      options.gas = await tx.estimateGas(options)
    }
    const txResponse = tx.send(options)
    const txResult: TransactionReceipt = await new Promise((resolve, reject) =>
      txResponse.once('receipt', (receipt: TransactionReceipt) => resolve(receipt)).catch(reject)
    )
    const proxyAddress = txResult.events?.ProxyCreation?.returnValues?.proxy
    if (!proxyAddress) {
      throw new Error('Safe Proxy was not deployed correctly')
    }
    return proxyAddress
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default GnosisSafeProxyFactoryWeb3Contract
