import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import { Gnosis_safe as Safe_V1_0_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0/Gnosis_safe'
import { Gnosis_safe as Safe_V1_1_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1/Gnosis_safe'
import { Gnosis_safe as Safe_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.2.0/Gnosis_safe'
import {
  Gnosis_safeInterface as SafeInterface,
  Gnosis_safe as Safe_V1_3_0
} from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0/Gnosis_safe'
import { Safe as Safe_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1/Safe'
import {
  SafeContract,
  SafeSetupConfig,
  SafeTransaction,
  SafeTransactionData,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'

abstract class SafeContractEthers implements SafeContract {
  constructor(
    public contract: Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1 | Safe_V1_0_0
  ) {}

  abstract setup(
    setupConfig: SafeSetupConfig,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult>

  async getVersion(): Promise<SafeVersion> {
    return (await this.contract.VERSION()) as SafeVersion
  }

  getAddress(): Promise<string> {
    return this.contract.getAddress()
  }

  async getNonce(): Promise<number> {
    return Number(await this.contract.nonce())
  }

  async getThreshold(): Promise<number> {
    return Number(await this.contract.getThreshold())
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

  async approvedHashes(ownerAddress: string, hash: string): Promise<bigint> {
    return this.contract.approvedHashes(ownerAddress, hash)
  }

  async approveHash(
    hash: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas('approveHash', [hash], { ...options })
    }
    const txResponse = await this.contract.approveHash(hash, { ...options })
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
      isTxValid = await this.contract.execTransaction.staticCall(
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
        { ...options }
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
      { ...options }
    )
    return toTxResult(txResponse, options)
  }

  encode: SafeInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: EthersTransactionOptions
  ): Promise<string> {
    const method = this.contract.getFunction(methodName)

    return (await method.estimateGas(...params, options)).toString()
  }
}

export default SafeContractEthers
