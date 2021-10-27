import { ContractTransaction, Event } from '@ethersproject/contracts'
import { ProxyFactory } from '../../../typechain/src/ethers-v5/v1.3.0/ProxyFactory'
import GnosisSafeProxyFactoryContract, { CreateProxyProps } from './GnosisSafeProxyFactoryContract'

class GnosisSafeProxyFactoryEthersV5Contract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: ProxyFactory) {}

  getAddress(): string {
    return this.contract.address
  }

  async createProxy({
    safeMasterCopyAddress,
    initializer,
    saltNonce,
    options
  }: CreateProxyProps): Promise<string> {
    let txResponse: ContractTransaction
    if (saltNonce) {
      txResponse = await this.contract.createProxyWithNonce(
        safeMasterCopyAddress,
        initializer,
        saltNonce,
        options
      )
    } else {
      txResponse = await this.contract.createProxy(safeMasterCopyAddress, initializer, options)
    }
    const txReceipt = await txResponse.wait()
    const proxyCreationEvent = txReceipt.events?.find(
      ({ event }: Event) => event === 'ProxyCreation'
    )
    if (!proxyCreationEvent || !proxyCreationEvent.args) {
      throw new Error('Safe Proxy was not deployed correctly')
    }
    const proxyAddress: string = proxyCreationEvent.args[0]
    return proxyAddress
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).interface.encodeFunctionData(methodName, params)
  }
}

export default GnosisSafeProxyFactoryEthersV5Contract
