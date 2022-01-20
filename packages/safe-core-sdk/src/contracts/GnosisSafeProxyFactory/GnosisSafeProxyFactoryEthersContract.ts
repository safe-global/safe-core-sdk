import { Event } from '@ethersproject/contracts'
import { ProxyFactory as ProxyFactory_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/ProxyFactory'
import { ProxyFactory as ProxyFactory_V1_3_0 } from '../../../typechain/src/ethers-v5/v1.3.0/ProxyFactory'
import GnosisSafeProxyFactoryContract, { CreateProxyProps } from './GnosisSafeProxyFactoryContract'

class GnosisSafeProxyFactoryEthersContract implements GnosisSafeProxyFactoryContract {
  constructor(public contract: ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1) {}

  getAddress(): string {
    return this.contract.address
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
    const txResponse = await this.contract.createProxyWithNonce(
      safeMasterCopyAddress,
      initializer,
      saltNonce,
      options
    )
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

export default GnosisSafeProxyFactoryEthersContract
