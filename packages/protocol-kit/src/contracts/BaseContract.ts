import { Abi } from 'abitype'
import {
  PublicClient,
  Address,
  getContract,
  encodeFunctionData,
  GetContractReturnType,
  WalletClient,
  Hash
} from 'viem'
import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SafeVersion,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'
import { asAddress } from '../utils/types'
import { ContractTransactionOptions } from '../types/contracts'

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
  runner: PublicClient | null

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
    runner?: PublicClient | null
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
    const client = this.runner || (await this.safeProvider.getExternalSigner())
    this.contract = getContract({
      address: this.contractAddress as Address,
      abi: this.contractAbi,
      client: client!
    })
  }

  async getTransactionReceipt(hash: Hash) {
    const client = this.runner
    return client?.getTransactionReceipt({ hash })
  }

  async convertOptions(options?: TransactionOptions): Promise<ContractTransactionOptions> {
    const chain = this.runner!.chain
    if (!chain) throw new Error() // Put something sensible here
    const signerAddress = await this.safeProvider.getSignerAddress()
    const account = asAddress(signerAddress!)
    const result: ContractTransactionOptions = { chain, account }
    if (options?.from) {
      result.account = asAddress(options.from)
    }

    if (options?.gasLimit) {
      result.gas = BigInt(options.gasLimit)
    }

    // if (options?.gasPrice) {
    //   result.gasPrice = BigInt(options.gasPrice)
    // }

    if (options?.maxFeePerGas) {
      result.maxFeePerGas = BigInt(options.maxFeePerGas)
    }

    if (options?.maxPriorityFeePerGas) {
      result.maxPriorityFeePerGas = BigInt(options.maxPriorityFeePerGas)
    }

    if (options?.nonce) {
      result.nonce = options.nonce
    }

    return result
  }

  getAddress: GetAddressFunction = () => {
    return Promise.resolve(this.contract.address)
  }

  encode: EncodeFunction<ContractAbiType> = (functionToEncode, args) => {
    const abi = this.contractAbi as Abi
    const functionName = functionToEncode as string
    return encodeFunctionData({
      abi,
      functionName,
      args
    })
  }

  estimateGas: EstimateGasFunction<ContractAbiType> = async (
    functionToEstimate,
    args,
    options = {}
  ) => {
    const contractOptions = await this.convertOptions(options)
    const abi = this.contractAbi as Abi
    return this.runner!.estimateContractGas({
      abi,
      functionName: functionToEstimate,
      address: this.contract.address,
      args,
      ...contractOptions
    })
  }
}

export default BaseContract
