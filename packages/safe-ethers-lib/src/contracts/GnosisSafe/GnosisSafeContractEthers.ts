import { BigNumber } from '@ethersproject/bignumber'
import {
  GnosisSafeContract,
  SafeTransaction,
  SafeTransactionData,
  SafeVersion
} from '@weichain/safe-core-sdk-types'
import { Gnosis_safe as GnosisSafe_V1_1_1 } from '../../../typechain/src/ethers-v5/v1.1.1/Gnosis_safe'
import { Gnosis_safe as GnosisSafe_V1_2_0 } from '../../../typechain/src/ethers-v5/v1.2.0/Gnosis_safe'
import {
  Gnosis_safe as GnosisSafe_V1_3_0,
  Gnosis_safeInterface as GnosisSafeInterface
} from '../../../typechain/src/ethers-v5/v1.3.0/Gnosis_safe'
import { EthersTransactionOptions, EthersTransactionResult } from '../../types'
import { toTxResult } from '../../utils'

abstract class GnosisSafeContractEthers implements GnosisSafeContract {
  constructor(public contract: GnosisSafe_V1_1_1 | GnosisSafe_V1_2_0 | GnosisSafe_V1_3_0) {}

  async getVersion(): Promise<SafeVersion> {
    return (await this.contract.VERSION()) as SafeVersion
  }

  getAddress(): string {
    return this.contract.address
  }

  async getNonce(): Promise<number> {
    return (await this.contract.nonce()).toNumber()
  }

  async getThreshold(): Promise<number> {
    return (await this.contract.getThreshold()).toNumber()
  }

  async getOwners(): Promise<string[]> {
    return this.contract.getOwners()
  }

  async isOwner(address: string): Promise<boolean> {
    return this.contract.isOwner(address)
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string> {
    return this.contract.getTransactionHash(
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
  }

  async approvedHashes(ownerAddress: string, hash: string): Promise<BigNumber> {
    return this.contract.approvedHashes(ownerAddress, hash)
  }

  async approveHash(
    hash: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas('approveHash', [hash], { ...options })
    }
    const txResponse = await this.contract.approveHash(hash, options)
    return toTxResult(txResponse, options)
  }

  abstract getModules(): Promise<string[]>

  abstract isModuleEnabled(moduleAddress: string): Promise<boolean>

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas(
        'execTransaction',
        [
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
        ],
        {
          ...options
        }
      )
    }
    const txResponse = await this.contract.execTransaction(
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures(),
      options
    )
    return toTxResult(txResponse, options)
  }

  encode: GnosisSafeInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: EthersTransactionOptions
  ): Promise<number> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toNumber()
  }
}

export default GnosisSafeContractEthers
