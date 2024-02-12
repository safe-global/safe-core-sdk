import {
  Chain,
  Hash,
  Transport,
  Abi,
  Client,
  Address,
  encodeFunctionData,
  WriteContractParameters,
  ContractFunctionName,
  ContractFunctionArgs,
  EstimateGasParameters
} from 'viem'
import { TransactionOptions, TransactionResult } from '@safe-global/safe-core-sdk-types'
import { UnionOmit } from 'viem/types/utils'
import { ReadContractParameters } from 'viem'
import { toBigInt } from './utils'
import { estimateGas, readContract, waitForTransactionReceipt, writeContract } from 'viem/actions'

type ViemTransactionOptions = UnionOmit<
  WriteContractParameters,
  'abi' | 'address' | 'args' | 'functionName'
>

export type ViemContractBaseArgs<
  TAddress extends Address = Address,
  TClient extends Client<Transport, Chain> = Client<Transport, Chain>
> = {
  address: TAddress
  client: TClient
}

export abstract class ViemContract<
  const TAbi extends Abi,
  TAddress extends Address = Address,
  const TClient extends Client<Transport, Chain> = Client<Transport, Chain>
> {
  public readonly address: TAddress
  public readonly abi: TAbi
  public readonly client: TClient

  constructor(args: ViemContractBaseArgs<TAddress, TClient> & { abi: TAbi }) {
    this.address = args.address
    this.abi = args.abi
    this.client = args.client
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
    return estimateGas(this.client, {
      to: this.address,
      data: this.encode(methodName, params),
      ...this.formatViemTransactionOptions(options)
    } as EstimateGasParameters).then((r) => String(r))
  }

  protected async readContract<
    TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
    TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>
  >(functionName: TFunctionName, args?: TArgs) {
    return readContract(this.client, {
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
    return writeContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName,
      args,
      ...this.formatViemTransactionOptions(options ?? {})
    } as WriteContractParameters<TAbi, TFunctionName, TArgs>).then((txHash) =>
      this.formatTransactionResult(txHash, options)
    )
  }

  protected formatTransactionResult(hash: Hash, options?: TransactionOptions): TransactionResult {
    return {
      hash,
      options,
      wait: async (confirmations) =>
        waitForTransactionReceipt(this.client, {
          hash,
          confirmations
        })
    }
  }

  protected formatViemTransactionOptions(txOptions: TransactionOptions) {
    return {
      account: this.client.account.address,
      gas: toBigInt(txOptions.gas),
      maxFeePerGas: toBigInt(txOptions.maxFeePerGas),
      maxPriorityFeePerGas: toBigInt(txOptions.maxPriorityFeePerGas),
      nonce: txOptions.nonce,
      chain: undefined,
      value: undefined
    } satisfies ViemTransactionOptions
  }
}
