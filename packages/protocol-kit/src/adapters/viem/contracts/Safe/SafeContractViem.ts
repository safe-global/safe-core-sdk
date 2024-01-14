import { Gnosis_safe__factory as Safe_V1_0_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0'
import { Gnosis_safe__factory as Safe_V1_1_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import { Gnosis_safe__factory as Safe_V1_2_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.2.0'
import { Gnosis_safe__factory as Safe_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Safe__factory as Safe_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import {
  SafeContract,
  SafeSetupConfig,
  SafeTransaction,
  SafeTransactionData,
  SafeVersion,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import { ContractTransactionReceipt as EthersTransactionReceipt } from 'ethers'
import {
  Account,
  Address,
  Chain,
  GetContractReturnType,
  Hash,
  PublicClient,
  Transport,
  WalletClient,
  getContract,
  encodeFunctionData,
  Abi,
  TransactionReceipt as ViemTransactionReceipt
} from 'viem'
import { type WriteContractParameters } from 'viem/actions/wallet/writeContract'
import { type UnionOmit } from 'viem/_types/types/utils'
import { formatViemSafeTransactionData } from '../../utils'

type ViemTransactionOptions = UnionOmit<
  WriteContractParameters,
  'abi' | 'address' | 'args' | 'functionName'
>

type SafeAbi =
  | typeof Safe_V1_4_1__factory.abi
  | typeof Safe_V1_3_0__factory.abi
  | typeof Safe_V1_2_0__factory.abi
  | typeof Safe_V1_1_1__factory.abi
  | typeof Safe_V1_0_0__factory.abi

export type SafeContractViemBaseArgs = {
  address: Address
  client: {
    public: PublicClient<Transport, Chain>
    wallet: WalletClient<Transport, Chain, Account>
  }
}

abstract class SafeContractViem implements SafeContract {
  public readonly contract: GetContractReturnType<SafeAbi, PublicClient<Transport, Chain>, Address>
  public readonly client: {
    public: PublicClient<Transport, Chain>
    wallet: WalletClient<Transport, Chain, Account>
  }

  constructor(args: SafeContractViemBaseArgs & { abi: SafeAbi }) {
    this.client = args.client
    this.contract = getContract({
      abi: args.abi,
      address: args.address,
      client: args.client
    })
  }

  abstract setup(
    setupConfig: SafeSetupConfig,
    options?: TransactionOptions
  ): Promise<TransactionResult>

  async getVersion(): Promise<SafeVersion> {
    return this.contract.read.VERSION().then((res) => res as SafeVersion)
  }

  async getAddress(): Promise<string> {
    return this.contract.address
  }

  async getNonce(): Promise<number> {
    return this.contract.read.nonce().then(Number)
  }

  async getThreshold(): Promise<number> {
    return this.contract.read.getThreshold().then(Number)
  }

  async getOwners(): Promise<string[]> {
    return this.contract.read.getOwners().then((res) => res as string[])
  }

  async isOwner(address: Address): Promise<boolean> {
    return this.contract.read.isOwner([address])
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string> {
    const data = formatViemSafeTransactionData(safeTransactionData)
    return this.contract.read.getTransactionHash([
      data.to,
      data.value,
      data.data,
      data.operation,
      data.safeTxGas,
      data.baseGas,
      data.gasPrice,
      data.gasToken,
      data.refundReceiver,
      data.nonce
    ])
  }

  async approvedHashes(ownerAddress: Address, hash: Hash): Promise<bigint> {
    return this.contract.read.approvedHashes([ownerAddress, hash])
  }

  async approveHash(hash: string, options?: TransactionOptions) {
    const txHash = await this.contract.write.approveHash(
      [hash as Hash],
      this.formatViemTransactionOptions(options ?? {})
    )
    return this.formatTransactionResult(txHash, options)
  }

  abstract getModules(): Promise<string[]>

  abstract isModuleEnabled(moduleAddress: string): Promise<boolean>

  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<boolean> {
    let isTxValid = false
    try {
      const data = formatViemSafeTransactionData(safeTransaction.data)
      const { result } = await this.contract.simulate.execTransaction(
        [
          data.to,
          data.value,
          data.data,
          data.operation,
          data.safeTxGas,
          data.baseGas,
          data.gasPrice,
          data.gasToken,
          data.refundReceiver,
          safeTransaction.encodedSignatures() as Hash
        ],
        this.formatViemTransactionOptions(options ?? {})
      )
      isTxValid = result
    } catch {}
    return isTxValid
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    const data = formatViemSafeTransactionData(safeTransaction.data)

    const txHash = await this.contract.write.execTransaction(
      [
        data.to,
        data.value,
        data.data,
        data.operation,
        data.safeTxGas,
        data.baseGas,
        data.gasPrice,
        data.gasToken,
        data.refundReceiver,
        safeTransaction.encodedSignatures() as Hash
      ],
      this.formatViemTransactionOptions(options ?? {})
    )

    return this.formatTransactionResult(txHash, options)
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

  protected formatTransactionResult(hash: Hash, options?: TransactionOptions): TransactionResult {
    return {
      hash,
      options,
      wait: async (confirmations) =>
        this.client.public.waitForTransactionReceipt({
          hash,
          confirmations
        })
    }
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

export default SafeContractViem
