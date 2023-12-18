import SafeBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/SafeBaseContractWeb3'
import {
  DeepWriteable,
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/adapters/web3/utils/constants'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import safe_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.4.1/safe_l2'
import {
  EncodeSafeFunction,
  EstimateGasSafeFunction
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/SafeBaseContract'
import SafeContract_v1_4_1_Contract, {
  SafeContract_v1_4_1_Abi as SafeContract_v1_4_1_Abi_Readonly
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.4.1/SafeContract_v1_4_1'
import { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'

// Remove all nested `readonly` modifiers from the ABI type
type SafeContract_v1_4_1_Abi = DeepWriteable<SafeContract_v1_4_1_Abi_Readonly>

/**
 * SafeContract_v1_4_1_Web3 is the implementation specific to the Safe contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.4.1 using Web3.js.
 *
 * @extends SafeBaseContractWeb3<SafeContract_v1_4_1_Abi> - Inherits from SafeBaseContractWeb3 with ABI specific to Safe contract version 1.4.1.
 * @implements SafeContract_v1_4_1_Contract - Implements the interface specific to Safe contract version 1.4.1.
 */
class SafeContract_v1_4_1_Web3
  extends SafeBaseContractWeb3<SafeContract_v1_4_1_Abi>
  implements SafeContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_4_1_Abi_Readonly
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = safe_1_4_1_ContractArtifacts.abi as SafeContract_v1_4_1_Abi

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi as SafeContract_v1_4_1_Abi
    )

    this.safeVersion = safeVersion
  }

  async VERSION(): Promise<[SafeVersion]> {
    return [await this.contract.methods.VERSION().call()]
  }

  async approvedHashes(args: readonly [owner: string, txHash: string]): Promise<[bigint]> {
    return [await this.contract.methods.approvedHashes(...args).call()]
  }

  async checkNSignatures(
    args: readonly [dataHash: string, data: string, signatures: string, requiredSignatures: bigint]
  ): Promise<[]> {
    // this method just checks whether the signature provided is valid for the provided data and hash. Reverts otherwise.
    if (this.contract.methods.checkNSignatures) {
      await this.contract.methods.checkNSignatures(...args).call()
    }
    return []
  }

  async checkSignatures(
    args: readonly [dataHash: string, data: string, signatures: string]
  ): Promise<[]> {
    await this.contract.methods.checkSignatures(...args).call()
    return []
  }

  async domainSeparator(): Promise<[string]> {
    return [await this.contract.methods.domainSeparator().call()]
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
    return [await this.contract.methods.encodeTransactionData(...args).call()]
  }

  async getChainId(): Promise<[bigint]> {
    return [await this.contract.methods.getChainId().call()]
  }

  async getModulesPaginated(
    args: readonly [start: string, pageSize: bigint]
  ): Promise<[modules: string[], next: string]> {
    const res = await this.contract.methods.getModulesPaginated(...args).call()
    return [res.array, res.next]
  }

  async getOwners(): Promise<readonly [string[]]> {
    return [await this.contract.methods.getOwners().call()]
  }

  async getStorageAt(args: readonly [offset: bigint, length: bigint]): Promise<[string]> {
    return [await this.contract.methods.getStorageAt(...args).call()]
  }

  async getThreshold(): Promise<[bigint]> {
    return [await this.contract.methods.getThreshold().call()]
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
    return [await this.contract.methods.getTransactionHash(...args).call()]
  }

  async isModuleEnabled(args: readonly [moduleAddress: string]): Promise<[boolean]> {
    return [await this.contract.methods.isModuleEnabled(...args).call()]
  }

  async isOwner(args: readonly [address: string]): Promise<[boolean]> {
    return [await this.contract.methods.isOwner(...args).call()]
  }

  async nonce(): Promise<[bigint]> {
    return [await this.contract.methods.nonce().call()]
  }

  async signedMessages(args: readonly [messageHash: string]): Promise<[bigint]> {
    return [await this.contract.methods.signedMessages(...args).call()]
  }

  encode: EncodeSafeFunction<SafeContract_v1_4_1_Abi_Readonly> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasSafeFunction<SafeContract_v1_4_1_Abi_Readonly, Web3TransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    return this.contract.methods[functionToEstimate](...args)
      .estimateGas(options)
      .then(BigInt)
  }

  // Custom method (not defined in the Safe Contract)
  // TODO: review this custom method
  async getModules(): Promise<string[]> {
    const { array } = await this.contract.methods.getModulesPaginated(SENTINEL_ADDRESS, 10).call()
    return array
  }

  // Custom method (not defined in the Safe Contract)
  getAddress(): Promise<string> {
    return Promise.resolve(this.contract.options.address)
  }

  // Custom method (not defined in the Safe Contract)
  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (
        await this.estimateGas(
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
        )
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

  // Custom method (not defined in the Safe Contract)
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options?: Web3TransactionOptions
  ): Promise<boolean> {
    let isTxValid = false
    try {
      if (options && !options.gas) {
        options.gas = (
          await this.estimateGas(
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
          )
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

  // Custom method (not defined in the Safe Contract)
  async approveHash(
    hash: string,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
    if (options && !options.gas) {
      options.gas = (await this.estimateGas('approveHash', [hash], { ...options })).toString()
    }
    const txResponse = this.contract.methods.approveHash(hash).send(options)
    return toTxResult(txResponse, options)
  }

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract as any,

      setup: (): any => {
        // setup function is labelled as `external` on the contract code, but not present on type SafeContract_v1_4_1_Contract
        return
      },

      approveHash: this.approveHash,

      isValidTransaction: this.isValidTransaction,

      execTransaction: this.execTransaction,

      getAddress: this.getAddress,

      getModules: this.getModules,

      isModuleEnabled: async (moduleAddress: string) =>
        (await this.isModuleEnabled([moduleAddress]))[0],

      getVersion: async () => (await this.VERSION())[0] as SafeVersion,

      getNonce: async () => Number((await this.nonce())[0]),

      getThreshold: async () => Number((await this.getThreshold())[0]),

      getOwners: async () => (await this.getOwners())[0],

      isOwner: async (address: string) => (await this.isOwner([address]))[0],

      getTransactionHash: async (safeTransactionData: SafeTransactionData) => {
        return (
          await this.getTransactionHash([
            safeTransactionData.to,
            BigInt(safeTransactionData.value),
            safeTransactionData.data,
            safeTransactionData.operation,
            BigInt(safeTransactionData.safeTxGas),
            BigInt(safeTransactionData.baseGas),
            BigInt(safeTransactionData.gasPrice),
            safeTransactionData.gasToken,
            safeTransactionData.refundReceiver,
            BigInt(safeTransactionData.nonce)
          ])
        )[0]
      },

      approvedHashes: async (ownerAddress: string, hash: string) =>
        (await this.approvedHashes([ownerAddress, hash]))[0],

      encode: this.encode as any,

      estimateGas: this.estimateGas as any
    }
  }
}

export default SafeContract_v1_4_1_Web3
