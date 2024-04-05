import SafeBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/Safe/SafeBaseContractWeb3'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  SafeVersion,
  safe_1_2_0_ContractArtifacts,
  SafeContract_v1_2_0_Abi,
  SafeContract_v1_2_0_Contract,
  SafeTransaction,
  EncodeFunction,
  EstimateGasFunction,
  Web3TransactionOptions,
  GetAddressFunction,
  Web3TransactionResult
} from '@safe-global/safe-core-sdk-types'

/**
 * SafeContract_v1_2_0_Web3 is the implementation specific to the Safe contract version 1.2.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.2.0 using Web3.js.
 *
 * @extends SafeBaseContractWeb3<SafeContract_v1_2_0_Abi> - Inherits from SafeBaseContractWeb3 with ABI specific to Safe contract version 1.2.0.
 * @implements SafeContract_v1_2_0_Contract - Implements the interface specific to Safe contract version 1.2.0.
 */
class SafeContract_v1_2_0_Web3
  extends SafeBaseContractWeb3<DeepWriteable<SafeContract_v1_2_0_Abi>>
  implements SafeContract_v1_2_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_2_0_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.2.0 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: DeepWriteable<SafeContract_v1_2_0_Abi>
  ) {
    const safeVersion = '1.2.0'
    const defaultAbi = safe_1_2_0_ContractArtifacts.abi as DeepWriteable<SafeContract_v1_2_0_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi
    )

    this.safeVersion = safeVersion
  }

  async NAME(): Promise<[string]> {
    return [await this.contract.methods.NAME().call()]
  }

  async VERSION(): Promise<[SafeVersion]> {
    return [await this.contract.methods.VERSION().call()]
  }

  async approvedHashes(args: readonly [owner: string, txHash: string]): Promise<[bigint]> {
    return [await this.contract.methods.approvedHashes(...args).call()]
  }

  async domainSeparator(): Promise<[string]> {
    return [await this.contract.methods.domainSeparator().call()]
  }

  async getModules(): Promise<[string[]]> {
    return [await this.contract.methods.getModules().call()]
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

  async getThreshold(): Promise<[bigint]> {
    return [await this.contract.methods.getThreshold().call()]
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

  async getMessageHash(args: readonly [message: string]): Promise<[string]> {
    return [await this.contract.methods.getMessageHash(...args).call()]
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

  encode: EncodeFunction<SafeContract_v1_2_0_Abi> = (functionToEncode, args) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  estimateGas: EstimateGasFunction<SafeContract_v1_2_0_Abi, Web3TransactionOptions> = (
    functionToEstimate,
    args,
    options = {}
  ) => {
    return this.contract.methods[functionToEstimate](...args)
      .estimateGas(options)
      .then(BigInt)
  }

  // Custom method (not defined in the Safe Contract)
  getAddress: GetAddressFunction = () => {
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
}

export default SafeContract_v1_2_0_Web3
