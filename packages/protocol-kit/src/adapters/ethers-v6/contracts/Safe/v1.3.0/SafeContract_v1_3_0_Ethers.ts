import { Contract } from 'ethers'
import SafeBaseContractEthersv6 from '@safe-global/protocol-kit/adapters/ethers-v6/contracts/SafeBaseContractEthersv6'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import SafeContract_v1_3_0_Contract, {
  EncodeSafeFunction,
  EstimateSafeFunction,
  SafeContract_v1_3_0_Abi,
  Safe_v1_3_0_Write_Functions
} from '@safe-global/protocol-kit/contracts/AbiType/Safe/SafeContract_v1_3_0'
import { SafeTransaction } from 'packages/safe-core-sdk-types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import safe_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.3.0/gnosis_safe_l2'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'

// TODO: add docs (see safe.sol methods)
// TODO: create address type?

class SafeContract_v1_3_0_Ethers
  extends SafeBaseContractEthersv6<SafeContract_v1_3_0_Abi>
  implements SafeContract_v1_3_0_Contract
{
  contract: Contract
  adapter: EthersAdapter
  // TODO: define contractVersion (only for safe contract?)
  // TODO: define contractName
  // TODO: contract version detection based on the address ???

  constructor(
    ethersAdapter: EthersAdapter,
    chainId: bigint,
    // TODO: create safeAddress ???
    // TODO: create customContractAddress ???
    customAddress?: string, // returns the Safe Singleton instance if is empty
    customAbi?: SafeContract_v1_3_0_Abi,
    isL1SafeSingleton = false
  ) {
    super(chainId, '1.3.0', customAddress, customAbi, isL1SafeSingleton)

    // if no customAbi and no abi is present in the safe-deployments we our the hardcoded abi
    this.contractAbi = this.contractAbi || safe_1_3_0_ContractArtifacts.abi

    this.adapter = ethersAdapter
    this.contract = new Contract(this.contractAddress, this.contractAbi, ethersAdapter.getSigner())
  }

  // TODO: move this to SafeBaseContractEthersv6 ???
  encode: EncodeSafeFunction<Safe_v1_3_0_Write_Functions> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  // TODO: move this to SafeBaseContractEthersv6 ???
  estimateGas: EstimateSafeFunction<Safe_v1_3_0_Write_Functions> = (
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
}

export default SafeContract_v1_3_0_Ethers
