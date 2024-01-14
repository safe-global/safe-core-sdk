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
import { Address, Hash } from 'viem'
import { formatViemSafeTransactionData } from '../../utils'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type SafeAbi =
  | typeof Safe_V1_4_1__factory.abi
  | typeof Safe_V1_3_0__factory.abi
  | typeof Safe_V1_2_0__factory.abi
  | typeof Safe_V1_1_1__factory.abi
  | typeof Safe_V1_0_0__factory.abi

abstract class SafeContractViem extends ViemContract<SafeAbi> implements SafeContract {
  constructor(args: ViemContractBaseArgs & { abi: SafeAbi }) {
    super(args)
  }

  abstract setup(
    setupConfig: SafeSetupConfig,
    options?: TransactionOptions
  ): Promise<TransactionResult>

  async getVersion(): Promise<SafeVersion> {
    return this.readContract('VERSION').then((res) => res as SafeVersion)
  }

  async getNonce(): Promise<number> {
    return this.readContract('nonce').then(Number)
  }

  async getThreshold(): Promise<number> {
    return this.readContract('getThreshold').then(Number)
  }

  async getOwners(): Promise<Address[]> {
    return this.readContract('getOwners').then((res) => res as Address[])
  }

  async isOwner(address: string): Promise<boolean> {
    return this.readContract('isOwner', [address as Address])
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<Hash> {
    const data = formatViemSafeTransactionData(safeTransactionData)
    return this.readContract('getTransactionHash', [
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

  async approvedHashes(ownerAddress: string, hash: string): Promise<bigint> {
    return this.readContract('approvedHashes', [ownerAddress as Address, hash as Hash])
  }

  async approveHash(hash: string, options?: TransactionOptions): Promise<TransactionResult> {
    return this.writeContract('approveHash', [hash as Hash], options)
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
      const { result } = await this.publicClient.simulateContract({
        abi: this.abi,
        address: this.address,
        functionName: 'execTransaction',
        args: [
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
        ...this.formatViemTransactionOptions(options ?? {})
      })
      isTxValid = result
    } catch {}
    return isTxValid
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    const data = formatViemSafeTransactionData(safeTransaction.data)
    return this.writeContract(
      'execTransaction',
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
      options
    )
  }
}

export default SafeContractViem
