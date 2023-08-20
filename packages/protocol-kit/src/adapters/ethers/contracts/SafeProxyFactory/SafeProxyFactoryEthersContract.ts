import { BigNumber } from '@ethersproject/bignumber'
import { Event } from '@ethersproject/contracts'
import { ethers } from 'ethers'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers/types'
import { Proxy_factory as SafeProxyFactory_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/Proxy_factory'
import { Proxy_factory as SafeProxyFactory_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/Proxy_factory'
import { Proxy_factory as SafeProxyFactory_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Proxy_factory'
import { Safe_proxy_factory as SafeProxyFactory_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Safe_proxy_factory'
import { SafeProxyFactoryContract } from '@safe-global/safe-core-sdk-types'

export interface CreateProxyProps {
  safeMasterCopyAddress: string
  initializer: string
  saltNonce: string
  options?: EthersTransactionOptions
  callback?: (txHash: string) => void
}

class SafeProxyFactoryEthersContract implements SafeProxyFactoryContract {
  constructor(
    public contract:
      | SafeProxyFactory_V1_4_1
      | SafeProxyFactory_V1_3_0
      | SafeProxyFactory_V1_1_1
      | SafeProxyFactory_V1_0_0
  ) {}

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
        const proxyCreationLog = txReceipt?.events?.find(
          ({ topics }: Event) =>
            topics[0] === '0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235'
        ) as Event | undefined

        let proxyCreationEventArgs: { 0: string; 1: string; proxy: string; singleton: string }
          | undefined
        if (proxyCreationLog) {
          if (proxyCreationLog.topics.length == 1) {
            const ifaceNonIndexedProxyAddress = new ethers.utils.Interface([
              'event ProxyCreation(address proxy, address singleton)'
            ])
            proxyCreationEventArgs = ifaceNonIndexedProxyAddress.decodeEventLog(
              'ProxyCreation',
              proxyCreationLog.data,
              proxyCreationLog.topics
            ) as unknown as typeof proxyCreationEventArgs
          } else if (proxyCreationLog.topics.length == 2) {
            const ifaceIndexedProxyAddress = new ethers.utils.Interface([
              'event ProxyCreation(address indexed proxy, address singleton)'
            ])
            proxyCreationEventArgs = ifaceIndexedProxyAddress.decodeEventLog(
              'ProxyCreation',
              proxyCreationLog.data,
              proxyCreationLog.topics
            ) as unknown as typeof proxyCreationEventArgs
            }
        }

        if (!proxyCreationEventArgs?.proxy) {
          throw new Error('SafeProxy was not deployed correctly')
        }
        const proxyAddress: string = proxyCreationEventArgs.proxy
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

export default SafeProxyFactoryEthersContract
