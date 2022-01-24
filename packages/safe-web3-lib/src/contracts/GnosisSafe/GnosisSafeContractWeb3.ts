import { BigNumber } from '@ethersproject/bignumber'
import { BaseTransactionResult, GnosisSafeContract, SafeTransaction, SafeTransactionData, TransactionOptions } from '@gnosis.pm/safe-core-sdk-types'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import { GnosisSafe as GnosisSafe_V1_1_1 } from '../../../typechain/src/web3-v1/v1.1.1/gnosis_safe'
import { GnosisSafe as GnosisSafe_V1_2_0 } from '../../../typechain/src/web3-v1/v1.2.0/gnosis_safe'
import { GnosisSafe as GnosisSafe_V1_3_0 } from '../../../typechain/src/web3-v1/v1.3.0/gnosis_safe'

export interface Web3TransactionResult extends BaseTransactionResult {
  promiEvent: PromiEvent<TransactionReceipt>
  options?: TransactionOptions
}

function toTxResult(
  promiEvent: PromiEvent<TransactionReceipt>,
  options?: TransactionOptions
): Promise<Web3TransactionResult> {
  return new Promise((resolve, reject) =>
    promiEvent
      .once('transactionHash', (hash: string) => resolve({ hash, promiEvent, options }))
      .catch(reject)
  )
}

abstract class GnosisSafeContractWeb3 implements GnosisSafeContract {
  constructor(public contract: GnosisSafe_V1_1_1 | GnosisSafe_V1_2_0 | GnosisSafe_V1_3_0) {}

  async getVersion(): Promise<string> {
    return this.contract.methods.VERSION().call()
  }

  getAddress(): string {
    return this.contract.options.address
  }

  async getNonce(): Promise<number> {
    return Number(await this.contract.methods.nonce().call())
  }

  async getThreshold(): Promise<number> {
    return Number(await this.contract.methods.getThreshold().call())
  }

  async getOwners(): Promise<string[]> {
    return this.contract.methods.getOwners().call()
  }

  async isOwner(address: string): Promise<boolean> {
    return this.contract.methods.isOwner(address).call()
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string> {
    return this.contract.methods
      .getTransactionHash(
        safeTransactionData.to,
        safeTransactionData.value,
        safeTransactionData.data,
        safeTransactionData.operation,
        safeTransactionData.safeTxGas,
        safeTransactionData.baseGas,
        safeTransactionData.gasPrice,
        safeTransactionData.gasToken,
        safeTransactionData.refundReceiver,
        safeTransactionData.nonce
      )
      .call()
  }

  async approvedHashes(ownerAddress: string, hash: string): Promise<BigNumber> {
    return BigNumber.from(await this.contract.methods.approvedHashes(ownerAddress, hash).call())
  }

  async approveHash(hash: string, options?: TransactionOptions): Promise<Web3TransactionResult> {
    const txResponse = this.contract.methods.approveHash(hash).send(options)
    return toTxResult(txResponse, options)
  }

  abstract getModules(): Promise<string[]>

  abstract isModuleEnabled(moduleAddress: string): Promise<boolean>

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<Web3TransactionResult> {
    const txResponse = this.contract.methods
      .execTransaction(
        safeTransaction.data.to,
        safeTransaction.data.value,
        safeTransaction.data.data,
        safeTransaction.data.operation,
        safeTransaction.data.safeTxGas,
        safeTransaction.data.baseGas,
        safeTransaction.data.gasPrice,
        safeTransaction.data.gasToken,
        safeTransaction.data.refundReceiver,
        safeTransaction.encodedSignatures()
      )
      .send(options)
    return toTxResult(txResponse, options)
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract.methods as any)[methodName](...params).encodeABI()
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: TransactionOptions
  ): Promise<number> {
    return Number(await (this.contract.methods as any)[methodName](...params).estimateGas(options))
  }
}

export default GnosisSafeContractWeb3
