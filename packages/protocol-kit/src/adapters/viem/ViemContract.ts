import {
  Account,
  Chain,
  Hash,
  Transport,
  WalletClient,
  Abi,
  Client,
  Address,
  encodeFunctionData,
  PublicClient,
  WriteContractParameters,
  ContractFunctionName,
  ContractFunctionArgs,
  EstimateGasParameters
} from 'viem'
import { TransactionOptions, TransactionResult } from '@safe-global/safe-core-sdk-types'
import { UnionOmit } from 'viem/types/utils'
import { ReadContractParameters } from 'viem'
import { KeyedClient } from './types'
import { toBigInt } from './utils'

type ViemTransactionOptions = UnionOmit<
  WriteContractParameters,
  'abi' | 'address' | 'args' | 'functionName'
>

export type ViemContractBaseArgs<
  TAddress extends Address = Address,
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account = Account,
  TClient extends
    | Client<TTransport, TChain, TAccount>
    | KeyedClient<TTransport, TChain, TAccount> = Client<TTransport, TChain, TAccount>
> = {
  address: TAddress
  client: TClient
}

export abstract class ViemContract<
  const TAbi extends Abi,
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account = Account,
  TAddress extends Address = Address,
  const TClient extends
    | Client<TTransport, TChain, TAccount>
    | KeyedClient<TTransport, TChain, TAccount> = Client<TTransport, TChain, TAccount>
> {
  public readonly address: TAddress
  public readonly abi: TAbi
  private readonly _publicClient: PublicClient<TTransport, TChain> | undefined
  private readonly _walletClient: WalletClient<TTransport, TChain, TAccount> | undefined

  constructor(
    args: ViemContractBaseArgs<TAddress, TTransport, TChain, TAccount, TClient> & { abi: TAbi }
  ) {
    this.address = args.address
    this.abi = args.abi

    const [publicClient, walletClient] = (() => {
      const { client } = args
      if ('public' in client && 'wallet' in client) return [client.public, client.wallet]
      if ('public' in client) return [client.public, undefined]
      if ('wallet' in client) return [undefined, client.wallet]
      return [client, client]
    })()

    this._publicClient = publicClient as PublicClient<TTransport, TChain>
    this._walletClient = walletClient as WalletClient<TTransport, TChain, TAccount>
  }

  get publicClient() {
    if (!this._publicClient) throw new Error('PublicClient is not configured')
    return this._publicClient
  }

  get walletClient() {
    if (!this._walletClient) throw new Error('WalletClient is not configured')
    return this._walletClient
  }

  async getAddress() {
    return this.address
  }

  encode(methodName: string, params: unknown[]) {
    return encodeFunctionData({
      abi: this.abi as any,
      functionName: methodName as any,
      args: params as any
    })
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: TransactionOptions
  ): Promise<string> {
    return this.publicClient
      .estimateGas({
        to: this.address,
        data: this.encode(methodName, params),
        ...this.formatViemTransactionOptions(options)
      } as EstimateGasParameters)
      .then((r) => String(r))
  }

  protected async readContract<
    TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
    TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>
  >(functionName: TFunctionName, args?: TArgs) {
    return this.publicClient.readContract({
      abi: this.abi,
      address: this.address,
      functionName: functionName,
      args: args
    } as ReadContractParameters<TAbi, TFunctionName, TArgs>)
  }

  protected async writeContract<
    TFunctionName extends ContractFunctionName<TAbi, 'payable' | 'nonpayable'>,
    TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>
  >(functionName: TFunctionName, args: TArgs, options?: TransactionOptions) {
    return this.walletClient
      .writeContract({
        abi: this.abi,
        address: this.address,
        functionName,
        args,
        ...this.formatViemTransactionOptions(options ?? {})
      } as WriteContractParameters<TAbi, TFunctionName, TArgs>)
      .then((txHash) => this.formatTransactionResult(txHash, options))
  }

  protected formatTransactionResult(hash: Hash, options?: TransactionOptions): TransactionResult {
    return {
      hash,
      options,
      wait: async (confirmations) =>
        this.publicClient.waitForTransactionReceipt({
          hash,
          confirmations
        })
    }
  }

  protected formatViemTransactionOptions(txOptions: TransactionOptions) {
    return {
      account: this.walletClient.account.address,
      gas: toBigInt(txOptions.gas),
      maxFeePerGas: toBigInt(txOptions.maxFeePerGas),
      maxPriorityFeePerGas: toBigInt(txOptions.maxPriorityFeePerGas),
      nonce: txOptions.nonce,
      chain: undefined,
      value: undefined
    } satisfies ViemTransactionOptions
  }
}
