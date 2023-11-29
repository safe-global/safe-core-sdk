import SafeBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/Safe/SafeBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import SafeContract_v1_4_1_Contract, {
  SafeContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/v1.4.1/SafeContract_v1_4_1'
import { SafeTransaction } from 'packages/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import safe_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.4.1/safe_l2'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { SafeVersion } from 'packages/safe-core-sdk-types'
import {
  EncodeSafeFunction,
  EstimateGasSafeFunction
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/SafeBaseContract'

/**
 * SafeContract_v1_4_1_Ethers is the implementation specific to the Safe contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SafeBaseContractEthers<SafeContract_v1_4_1_Abi> - Inherits from SafeBaseContractEthers with ABI specific to Safe contract version 1.4.1.
 * @implements SafeContract_v1_4_1_Contract - Implements the interface specific to Safe contract version 1.4.1.
 */
class SafeContract_v1_4_1_Ethers
  extends SafeBaseContractEthers<SafeContract_v1_4_1_Abi>
  implements SafeContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_4_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = safe_1_4_1_ContractArtifacts.abi

    super(
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi
    )

    this.safeVersion = safeVersion
  }

  encode: EncodeSafeFunction<SafeContract_v1_4_1_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  estimateGas: EstimateGasSafeFunction<SafeContract_v1_4_1_Abi> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractMethodToStimate = this.contract.getFunction(functionToEstimate)

    return contractMethodToStimate.estimateGas(...args, options)
  }

  async VERSION(): Promise<[string]> {
    return [await this.contract.VERSION()]
  }

  async approvedHashes([owner, txHash]: readonly [string, string]): Promise<[bigint]> {
    return [await this.contract.approvedHashes(owner, txHash)]
  }

  // TODO: rename the args
  async checkNSignatures(args: readonly [string, string, string, bigint]): Promise<[]> {
    // this method just checks whether the signature provided is valid for the provided data and hash. Reverts otherwise.
    await this.contract.checkNSignatures(...args)
    return []
  }

  // TODO: rename the args
  async checkSignatures(args: readonly [string, string, string]): Promise<[]> {
    await this.contract.checkSignatures(...args)
    return []
  }

  async domainSeparator(): Promise<[string]> {
    return [await this.contract.domainSeparator()]
  }

  // TODO: rename the args
  async encodeTransactionData(
    args: readonly [string, bigint, string, number, bigint, bigint, bigint, string, string, bigint]
  ): Promise<[string]> {
    return [await this.contract.encodeTransactionData(...args)]
  }

  async getChainId(): Promise<[bigint]> {
    return [await this.contract.getChainId()]
  }

  // TODO: rename the args
  getModulesPaginated(
    args: readonly [start: string, pageSize: bigint]
  ): Promise<[modules: string[], next: string]> {
    return this.contract.getModulesPaginated(...args)
  }

  async getOwners(): Promise<readonly [string[]]> {
    return [await this.contract.getOwners()]
  }

  // TODO: rename the args
  async getStorageAt(args: readonly [bigint, bigint]): Promise<[string]> {
    return [await this.contract.getStorageAt(...args)]
  }

  async getThreshold(): Promise<[bigint]> {
    return [await this.contract.getThreshold()]
  }

  // TODO: rename the args
  async getTransactionHash(
    args: readonly [string, bigint, string, number, bigint, bigint, bigint, string, string, bigint]
  ): Promise<[string]> {
    return [await this.contract.getTransactionHash(...args)]
  }

  // TODO: rename the args
  async isModuleEnabled(args: readonly [string]): Promise<[boolean]> {
    return [await this.contract.isModuleEnabled(...args)]
  }

  // TODO: rename the args
  async isOwner(args: readonly [string]): Promise<[boolean]> {
    return [await this.contract.isOwner(...args)]
  }

  async nonce(): Promise<[bigint]> {
    return [await this.contract.nonce()]
  }

  // TODO: rename the args
  async signedMessages(args: readonly [string]): Promise<[bigint]> {
    return [await this.contract.signedMessages(...args)]
  }

  // custom methods (not defined in the Safe Contract)
  async isValidTransaction(
    safeTransaction: SafeTransaction,
    options: EthersTransactionOptions = {}
  ) {
    try {
      const gasLimit =
        options?.gasLimit ||
        (await this.estimateGas(
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
        ))

      return await this.contract.execTransaction.staticCall(
        safeTransaction.data.to,
        BigInt(safeTransaction.data.value),
        safeTransaction.data.data,
        safeTransaction.data.operation,
        BigInt(safeTransaction.data.safeTxGas),
        BigInt(safeTransaction.data.baseGas),
        BigInt(safeTransaction.data.gasPrice),
        safeTransaction.data.gasToken,
        safeTransaction.data.refundReceiver,
        safeTransaction.encodedSignatures(),
        { ...options, gasLimit }
      )
    } catch (error) {
      return false
    }
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    const gasLimit =
      options?.gasLimit ||
      (await this.estimateGas(
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
      ))

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
      { ...options, gasLimit }
    )

    return toTxResult(txResponse, options)
  }

  // TODO: review this custom method
  async getModules(): Promise<string[]> {
    const [modules] = await this.contract.getModulesPaginated(SENTINEL_ADDRESS, 10)
    return modules
  }

  async approveHash(
    hash: string,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    const gasLimit = options?.gasLimit || (await this.estimateGas('approveHash', [hash], options))
    const txResponse = await this.contract.approveHash(hash, { ...options, gasLimit })

    return toTxResult(txResponse, options)
  }

  getAddress(): Promise<string> {
    return this.contract.getAddress()
  }
}

export default SafeContract_v1_4_1_Ethers
