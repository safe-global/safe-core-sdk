import { Abi } from 'abitype'
import {
  PublicClient,
  Transport,
  encodeFunctionData,
  GetContractReturnType,
  WalletClient,
  Hash,
  Chain,
  getContract
} from 'viem'
import { estimateContractGas, getTransactionReceipt } from 'viem/actions'
import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SafeVersion,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'
import { asAddress, getChainById } from '../utils/types'
import {
  WalletTransactionOptions,
  WalletLegacyTransactionOptions,
  convertTransactionOptions
} from '@safe-global/protocol-kit/utils'
import { ExternalClient } from '../types'

/**
 * Abstract class BaseContract
 * It is designed to be instantiated for different contracts.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with the smart contract.
 *
 * Subclasses of BaseContract are expected to represent specific contracts.
 *
 * @template ContractAbiType - The ABI type specific to the version of the contract, extending InterfaceAbi from Ethers.
 *
 * Example subclasses:
 * - SafeBaseContract<SafeContractAbiType> extends BaseContract<SafeContractAbiType>
 * - CreateCallBaseContract<CreateCallContractAbiType> extends BaseContract<CreateCallContractAbiType>
 * - SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> extends BaseContract<SafeProxyFactoryContractAbiType>
 */
class BaseContract<ContractAbiType extends Abi> {
  contractAbi: ContractAbiType
  contractAddress: string
  contractName: contractName
  safeVersion: SafeVersion
  safeProvider: SafeProvider
  chainId: bigint
  contract!: GetContractReturnType<ContractAbiType, WalletClient | PublicClient>
  runner: ExternalClient
  wallet?: WalletClient<Transport, Chain | undefined>

  /**
   * @constructor
   * Constructs an instance of BaseContract.
   *
   * @param contractName - The contract name.
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType,
    runner?: ExternalClient
  ) {
    const deployment = getContractDeployment(safeVersion, chainId, contractName)

    const contractAddress =
      customContractAddress ||
      deployment?.networkAddresses[chainId.toString()] ||
      deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error(`Invalid ${contractName.replace('Version', '')} contract address`)
    }

    this.chainId = chainId
    this.contractName = contractName
    this.safeVersion = safeVersion
    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as unknown as ContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi

    this.runner = runner || safeProvider.getExternalProvider()
    this.safeProvider = safeProvider
  }

  async init() {
    this.wallet = await this.safeProvider.getExternalSigner()
    this.contract = getContract({
      address: asAddress(this.contractAddress),
      abi: this.contractAbi,
      client: this.wallet || this.runner
    })
  }

  async getTransactionReceipt(hash: Hash) {
    return getTransactionReceipt(this.runner, { hash })
  }

  /**
   * Converts a type of TransactionOptions to a viem transaction type. The viem transaction type creates a clear distinction between the multiple transaction objects (e.g., post-London hard fork) and doesn't allow a union of fields.
   * See: https://github.com/wevm/viem/blob/viem%402.18.0/src/types/fee.ts and https://github.com/wevm/viem/blob/603227e2588366914fb79a902d23fd9afc353cc6/src/types/transaction.ts#L200
   *
   * @param options - Transaction options as expected throughout safe sdk and propagated on the results.
   *
   * @returns Options object compatible with viem
   */
  async convertOptions(
    options?: TransactionOptions
  ): Promise<WalletTransactionOptions | WalletLegacyTransactionOptions> {
    const chain = this.getChain()
    if (!chain) throw new Error('Invalid chainId')

    const signerAddress = await this.safeProvider.getSignerAddress()
    const signer = this.wallet?.account
    if (!signer || !signerAddress) throw new Error('Invalid signer')

    const account = signer || asAddress(signerAddress)
    this.wallet?.writeContract()
    const txOptions = await convertTransactionOptions(options)
    return { chain, ...txOptions, account } // Needs to be in this order to override the `account` if necessary
  }

  getChain(): Chain | undefined {
    return getChainById(this.chainId)
  }

  getAddress: GetAddressFunction = () => {
    return Promise.resolve(this.contract.address)
  }

  encode: EncodeFunction<ContractAbiType> = (functionToEncode, args) => {
    const abi = this.contractAbi as Abi
    const functionName = functionToEncode as string
    const params = args as unknown[]
    return encodeFunctionData({
      abi,
      functionName,
      args: params
    })
  }

  estimateGas: EstimateGasFunction<ContractAbiType> = async (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractOptions = await this.convertOptions(options)
    const abi = this.contractAbi as Abi
    const params = args as unknown[]
    return estimateContractGas(this.runner, {
      abi,
      functionName: functionToEstimate,
      address: this.contract.address,
      args: params,
      ...contractOptions
    })
  }
}

export default BaseContract
