import { TransactionReceipt } from 'web3-core/types'
import { ProxyFactory as ProxyFactory_V1_1_1 } from '../../../typechain/src/web3-v1/v1.1.1/proxy_factory'
import { ProxyFactory as ProxyFactory_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/proxy_factory'
import GnosisSafeProxyFactoryContract, { CreateProxyProps } from './GnosisSafeProxyFactoryContract'

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
    const txResponse = this.contract.methods
      .createProxyWithNonce(safeMasterCopyAddress, initializer, saltNonce)
      .send(options)

    const txResult: TransactionReceipt = await new Promise((resolve, reject) =>
      txResponse.once('receipt', (receipt: TransactionReceipt) => resolve(receipt)).catch(reject)
    )
    const proxyAddress = txResult.events?.['0'].raw?.data.substr(-40)
    if (!proxyAddress) {
      throw new Error('Safe Proxy was not deployed correctly')
    }
    return '0x' + proxyAddress
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default GnosisSafeProxyFactoryWeb3Contract
