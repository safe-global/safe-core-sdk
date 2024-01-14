import { Proxy_factory__factory as SafeProxyFactory_V1_0_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0'
import { Proxy_factory__factory as SafeProxyFactory_V1_1_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import { Proxy_factory__factory as SafeProxyFactory_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Safe_proxy_factory__factory as SafeProxyFactory_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { SafeProxyFactoryContract, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import {
  Address,
  Chain,
  GetContractReturnType,
  Hash,
  PublicClient,
  Transport,
  WriteContractParameters,
  decodeEventLog,
  encodeFunctionData,
  getContract
} from 'viem'
import { UnionOmit } from 'viem/types/utils'
import { ClientPair } from '../../types'
import { TransactionReceipt } from 'viem'

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

type ViemTransactionOptions = UnionOmit<
  WriteContractParameters,
  'abi' | 'address' | 'args' | 'functionName'
>

type SafeProxyFactoryAbi =
  | typeof SafeProxyFactory_V1_4_1__factory.abi
  | typeof SafeProxyFactory_V1_3_0__factory.abi
  | typeof SafeProxyFactory_V1_1_1__factory.abi
  | typeof SafeProxyFactory_V1_0_0__factory.abi

export type SafeProxyFactoryContractViemBaseArgs = {
  address: Address
  client: ClientPair
}

class SafeProxyFactoryContractViem implements SafeProxyFactoryContract {
  public readonly contract: GetContractReturnType<
    SafeProxyFactoryAbi,
    PublicClient<Transport, Chain>,
    Address
  >
  public readonly client: ClientPair

  constructor(args: SafeProxyFactoryContractViemBaseArgs & { abi: SafeProxyFactoryAbi }) {
    this.client = args.client
    this.contract = getContract({
      abi: args.abi,
      address: args.address,
      client: args.client
    })
  }

  async getAddress(): Promise<string> {
    return this.contract.address
  }

  async proxyCreationCode(): Promise<string> {
    return this.contract.read.proxyCreationCode()
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

    const proxyAddress = this.contract.write
      .createProxyWithNonce(
        [safeSingletonAddress as Address, initializer as Hash, bnSaltNonce],
        this.formatViemTransactionOptions(options ?? {})
      )
      .then(async (hash) => {
        if (callback) {
          callback(hash)
        }
        const txReceipt: TransactionReceipt = await this.client.public.waitForTransactionReceipt({
          hash
        })

        const events = txReceipt.logs.flatMap((log) => {
          try {
            return decodeEventLog({ abi: this.contract.abi, ...log })
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

  encode(methodName: string, params: unknown[]) {
    return encodeFunctionData({
      abi: this.contract.abi,
      functionName: methodName as any,
      args: params as any
    })
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: TransactionOptions
  ): Promise<string> {
    return this.client.public
      .estimateGas({
        to: this.contract.address,
        data: this.encode(methodName, params),
        ...this.formatViemTransactionOptions(options)
      })
      .then((r) => String(r))
  }

  protected formatViemTransactionOptions(txOptions: TransactionOptions) {
    return {
      account: this.client.wallet.account.address,
      gas: txOptions.gas == null ? undefined : BigInt(txOptions.gas),
      maxFeePerGas: txOptions.maxFeePerGas == null ? undefined : BigInt(txOptions.maxFeePerGas),
      maxPriorityFeePerGas:
        txOptions.maxPriorityFeePerGas == null ? undefined : BigInt(txOptions.maxPriorityFeePerGas),
      nonce: txOptions.nonce,
      chain: undefined,
      value: undefined
    } satisfies ViemTransactionOptions
  }
}

export default SafeProxyFactoryContractViem
