import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import { GnosisSafeProxyFactory } from '../../types/typechain/web3-v1/GnosisSafeProxyFactory'
import GnosisSafeProxyFactoryContract, { CreateProxyProps } from './GnosisSafeProxyFactoryContract'

class GnosisSafeProxyFactoryWeb3Contract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: GnosisSafeProxyFactory) {}

  getAddress(): string {
    return this.contract.options.address
  }

  async createProxy({
    safeMasterCopyAddress,
    initializer,
    saltNonce,
    options
  }: CreateProxyProps): Promise<string> {
    let txResponse: PromiEvent<TransactionReceipt>
    if (saltNonce) {
      txResponse = this.contract.methods
        .createProxyWithNonce(safeMasterCopyAddress, initializer, saltNonce)
        .send(options)
    } else {
      txResponse = this.contract.methods
        .createProxy(safeMasterCopyAddress, initializer)
        .send(options)
    }
    const txResult: TransactionReceipt = await new Promise((resolve, reject) =>
      txResponse.once('receipt', (receipt: TransactionReceipt) => resolve(receipt)).catch(reject)
    )
    const proxyAddress = '0x' + txResult.events?.['0'].raw?.data.substr(-40)
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
