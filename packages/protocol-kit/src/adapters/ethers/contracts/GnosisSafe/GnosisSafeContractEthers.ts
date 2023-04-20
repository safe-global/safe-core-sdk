import { BigNumber } from '@ethersproject/bignumber'
import {
  GnosisSafeContract,
  SafeTransaction,
  SafeTransactionData,
  SafeVersion,
  SafeSetupConfig
} from '@safe-global/safe-core-sdk-types'
import { Gnosis_safe as GnosisSafe_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/Gnosis_safe'
import { Gnosis_safe as GnosisSafe_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/Gnosis_safe'
import { Gnosis_safe as GnosisSafe_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.2.0/Gnosis_safe'
import {
  Gnosis_safe as GnosisSafe_V1_3_0,
  Gnosis_safeInterface as GnosisSafeInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Gnosis_safe'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'

abstract class GnosisSafeContractEthers implements GnosisSafeContract {
  constructor(
    public contract: GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1 | GnosisSafe_V1_0_0
  ) {}

  abstract setup(
    setupConfig: SafeSetupConfig,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult>

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

  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options?: EthersTransactionOptions
  ): Promise<boolean> {
    let isTxValid = false
    try {
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
      isTxValid = await this.contract.callStatic.execTransaction(
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
    } catch {}
    return isTxValid
  }

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
  ): Promise<string> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toString()
  }
}

export default GnosisSafeContractEthers
