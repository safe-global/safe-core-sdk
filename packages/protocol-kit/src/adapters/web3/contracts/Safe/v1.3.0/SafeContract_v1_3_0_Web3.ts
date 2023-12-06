import SafeBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/SafeBaseContractWeb3'
import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/adapters/web3/utils/constants'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safe_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.3.0/gnosis_safe_l2'
import {
  EncodeSafeFunction,
  EstimateGasSafeFunction
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/SafeBaseContract'
import SafeContract_v1_3_0_Contract, {
  SafeContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.3.0/SafeContract_v1_3_0'
import { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

/**
 * SafeContract_v1_3_0_Web3 is the implementation specific to the Safe contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.3.0 using Web3.js.
 *
 * @extends SafeBaseContractWeb3<SafeContract_v1_3_0_Abi> - Inherits from SafeBaseContractWeb3 with ABI specific to Safe contract version 1.3.0.
 * @implements SafeContract_v1_3_0_Contract - Implements the interface specific to Safe contract version 1.3.0.
 */
class SafeContract_v1_3_0_Web3
  extends SafeBaseContractWeb3<DeepWriteable<SafeContract_v1_3_0_Abi>>
  implements SafeContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_3_0_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = safe_1_3_0_ContractArtifacts.abi as DeepWriteable<SafeContract_v1_3_0_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi as DeepWriteable<SafeContract_v1_3_0_Abi>
    )

    this.safeVersion = safeVersion
  }

  encode: EncodeSafeFunction<SafeContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasSafeFunction<SafeContract_v1_3_0_Abi, Web3TransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    return this.contract.methods[functionToEstimate](...args)
      .estimateGas(options)
      .then(BigInt)
  }

  async VERSION(): Promise<[string]> {
    return [await this.contract.methods.VERSION()]
  }

  async approvedHashes([owner, txHash]: readonly [string, string]): Promise<[bigint]> {
    return [await this.contract.methods.approvedHashes(owner, txHash)]
  }

  async checkNSignatures(
    args: readonly [dataHash: string, data: string, signatures: string, requiredSignatures: bigint]
  ): Promise<[]> {
    // this method just checks whether the signature provided is valid for the provided data and hash. Reverts otherwise.
    if (this.contract.methods.checkNSignatures) {
      await this.contract.methods.checkNSignatures(...args)
    }
    return []
  }

  async checkSignatures(
    args: readonly [dataHash: string, data: string, signatures: string]
  ): Promise<[]> {
    await this.contract.methods.checkSignatures(...args)
    return []
  }

  async domainSeparator(): Promise<[string]> {
    return [await this.contract.methods.domainSeparator()]
  }

  async encodeTransactionData(
    args: readonly [
      to: string,
      value: bigint,
      data: string,
      operation: number,
      safeTxGas: bigint,
      baseGas: bigint,
      gasPrice: bigint,
      gasToken: string,
      refundReceiver: string,
      _nonce: bigint
    ]
  ): Promise<[string]> {
    return [await this.contract.methods.encodeTransactionData(...args)]
  }

  async getChainId(): Promise<[bigint]> {
    return [await this.contract.methods.getChainId()]
  }

  // TODO: review this custom method
  async getModules(): Promise<string[]> {
    const { array } = await this.contract.methods.getModulesPaginated(SENTINEL_ADDRESS, 10).call()
    return array
  }

  getModulesPaginated(
    args: readonly [start: string, pageSize: bigint]
  ): Promise<[modules: string[], next: string]> {
    return this.contract.methods.getModulesPaginated(...args)
  }

  async isModuleEnabled(args: readonly [moduleAddress: string]): Promise<[boolean]> {
    return [await this.contract.methods.isModuleEnabled(...args)]
  }

  async getOwners(): Promise<readonly [string[]]> {
    return [await this.contract.methods.getOwners()]
  }

  async getStorageAt(args: readonly [offset: bigint, length: bigint]): Promise<[string]> {
    return [await this.contract.methods.getStorageAt(...args)]
  }

  async getThreshold(): Promise<[bigint]> {
    return [await this.contract.methods.getThreshold()]
  }

  async getTransactionHash(
    args: readonly [
      to: string,
      value: bigint,
      data: string,
      operation: number,
      safeTxGas: bigint,
      baseGas: bigint,
      gasPrice: bigint,
      gasToken: string,
      refundReceiver: string,
      _nonce: bigint
    ]
  ): Promise<[string]> {
    return [await this.contract.methods.getTransactionHash(...args)]
  }

  async isOwner(args: readonly [address: string]): Promise<[boolean]> {
    return [await this.contract.methods.isOwner(...args)]
  }

  async nonce(): Promise<[bigint]> {
    return [await this.contract.methods.nonce()]
  }

  async getNonce(): Promise<number> {
    return Number(await this.contract.methods.nonce().call())
  }

  async signedMessages(args: readonly [messageHash: string]): Promise<[bigint]> {
    return [await this.contract.methods.signedMessages(...args)]
  }

  // custom methods (not defined in the Safe Contract)
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<boolean> {
    let isTxValid = false
    try {
      if (options && !options.gas) {
        options.gas = await this.estimateGas(
          'execTransaction',
          [
            safeTransaction.data.to,
            BigInt(safeTransaction.data.value),
            safeTransaction.data.data,
            safeTransaction.data.operation,
            BigInt(safeTransaction.data.safeTxGas),
            BigInt(safeTransaction.data.baseGas),
            BigInt(safeTransaction.data.gasPrice),
            safeTransaction.data.gasToken,
            safeTransaction.data.refundReceiver,
            safeTransaction.encodedSignatures()
          ],
          options
        ).toString()
      }
      isTxValid = await this.contract.methods
        .execTransaction(
          safeTransaction.data.to,
          BigInt(safeTransaction.data.value),
          safeTransaction.data.data,
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          safeTransaction.data.gasToken,
          safeTransaction.data.refundReceiver,
          safeTransaction.encodedSignatures()
        )
        .call(options)
    } catch {}
    return isTxValid
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.contract.options.address)
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = await this.estimateGas(
        'execTransaction',
        [
          safeTransaction.data.to,
          BigInt(safeTransaction.data.value),
          safeTransaction.data.data,
          safeTransaction.data.operation,
          BigInt(safeTransaction.data.safeTxGas),
          BigInt(safeTransaction.data.baseGas),
          BigInt(safeTransaction.data.gasPrice),
          safeTransaction.data.gasToken,
          safeTransaction.data.refundReceiver,
          safeTransaction.encodedSignatures()
        ],
        options
      ).toString()
    }
    const txResponse = this.contract.methods
      .execTransaction(
        safeTransaction.data.to,
        BigInt(safeTransaction.data.value),
        safeTransaction.data.data,
        safeTransaction.data.operation,
        BigInt(safeTransaction.data.safeTxGas),
        BigInt(safeTransaction.data.baseGas),
        BigInt(safeTransaction.data.gasPrice),
        safeTransaction.data.gasToken,
        safeTransaction.data.refundReceiver,
        safeTransaction.encodedSignatures()
      )
      .send(options)

    return toTxResult(txResponse, options)
  }

  async approveHash(
    hash: string,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = await this.estimateGas('approveHash', [hash], { ...options }).toString()
    }
    const txResponse = this.contract.methods.approveHash(hash).send(options)
    return toTxResult(txResponse, options)
  }
}

export default SafeContract_v1_3_0_Web3
