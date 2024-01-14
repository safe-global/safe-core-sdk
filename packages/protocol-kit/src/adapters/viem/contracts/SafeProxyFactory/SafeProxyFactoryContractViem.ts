import { Proxy_factory__factory as SafeProxyFactory_V1_0_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0'
import { Proxy_factory__factory as SafeProxyFactory_V1_1_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import { Proxy_factory__factory as SafeProxyFactory_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Safe_proxy_factory__factory as SafeProxyFactory_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { SafeProxyFactoryContract, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { Address, Hash, Hex, decodeEventLog } from 'viem'
import { TransactionReceipt } from 'viem'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

type SafeProxyFactoryAbi =
  | typeof SafeProxyFactory_V1_4_1__factory.abi
  | typeof SafeProxyFactory_V1_3_0__factory.abi
  | typeof SafeProxyFactory_V1_1_1__factory.abi
  | typeof SafeProxyFactory_V1_0_0__factory.abi

class SafeProxyFactoryContractViem
  extends ViemContract<SafeProxyFactoryAbi>
  implements SafeProxyFactoryContract
{
  constructor(args: ViemContractBaseArgs & { abi: SafeProxyFactoryAbi }) {
    super(args)
  }

  async proxyCreationCode(): Promise<Hex> {
    return this.readContract('proxyCreationCode').then((res) => res as Hex)
  }

  async createProxy({
    safeSingletonAddress,
    initializer,
    saltNonce,
    options,
    callback
  }: CreateProxyProps): Promise<Address> {
    const bnSaltNonce = BigInt(saltNonce)
    if (bnSaltNonce < 0n) throw new Error('saltNonce must be greater than or equal to 0')

    const proxyAddress = this.walletClient
      .writeContract({
        abi: this.abi,
        address: this.address,
        functionName: 'createProxyWithNonce',
        args: [safeSingletonAddress as Address, initializer as Hash, bnSaltNonce],
        ...this.formatViemTransactionOptions(options ?? {})
      })
      .then(async (hash) => {
        if (callback) {
          callback(hash)
        }
        const txReceipt: TransactionReceipt = await this.publicClient.waitForTransactionReceipt({
          hash
        })

        const events = txReceipt.logs.flatMap((log) => {
          try {
            return decodeEventLog({ abi: this.abi, ...log })
          } catch {
            return []
          }
        })
        const proxyCreationEvent = events.find((e) => e.eventName === 'ProxyCreation')
        if (!proxyCreationEvent) {
          throw new Error('SafeProxy was not deployed correctly')
        }
        return proxyCreationEvent.args.proxy
      })
    return proxyAddress
  }
}

export default SafeProxyFactoryContractViem
