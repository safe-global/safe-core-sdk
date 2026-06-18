import { Abi } from 'abitype'
import {
  ContractFunctionName,
  ContractFunctionArgs,
  Transport,
  encodeFunctionData,
  WalletClient,
  Hash,
  Chain
} from 'viem'
import { estimateContractGas, getTransactionReceipt } from 'viem/actions'
import { SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import { Deployment } from '@safe-global/safe-modules-deployments'
import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  EncodeFunction,
  EstimateGasFunction,
  GetAddressFunction,
  SafeVersion,
  TransactionOptions
} from '@safe-global/types-kit'
import { getChainById } from '../utils/types'
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
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType,
    deploymentType?: DeploymentType
  ) {
    const deployment = getContractDeployment(safeVersion, chainId, contractName)

    const resolvedAddress =
      customContractAddress ??
      this.#resolveAddress(
        deployment?.networkAddresses[chainId.toString()],
        deployment,
        deploymentType
      )

    if (!resolvedAddress) {
      throw new Error(`Invalid ${contractName.replace('Version', '')} contract address`)
    }

    this.chainId = chainId
    this.contractName = contractName
    this.safeVersion = safeVersion
    this.contractAddress = resolvedAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as unknown as ContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi

    this.runner = safeProvider.getExternalProvider()
    this.safeProvider = safeProvider
  }

  #resolveAddress(
    networkAddresses: string | string[] | undefined,
    deployment: SingletonDeploymentV2 | Deployment | undefined,
    deploymentType?: DeploymentType
  ): string | undefined {
    // If there are no addresses for the given chainId we return undefined
    if (!networkAddresses) {
      return undefined
    }

    // If a custom deployment type is selected, we check that type is available in the given chain
    // We ensure that we receive a SingletonDeploymentV2 object for this check,
    // otherwise we continue with the next logic (`@safe-global/safe-module-deployments` is not having this property.)
    if (deploymentType && deployment && 'deployments' in deployment) {
      const customDeploymentTypeAddress = deployment.deployments[deploymentType]?.address

      if (typeof networkAddresses === 'string') {
        return networkAddresses === customDeploymentTypeAddress
          ? customDeploymentTypeAddress
          : undefined
      }

      return networkAddresses.find((address) => address === customDeploymentTypeAddress)
    }

    // Deployment type is not selected and there is only one address for this contract in the given chain, we return it
    if (typeof networkAddresses === 'string') {
      return networkAddresses
    }

    // If there are multiple addresses available for this contract, we return the first one.
    return networkAddresses[0]
  }

  async init() {
    this.wallet = await this.safeProvider.getExternalSigner()
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
   * @returns Options object compatible with Viem
   */
  convertOptions(
    options?: TransactionOptions
  ): WalletTransactionOptions | WalletLegacyTransactionOptions {
    const chain = this.getChain()
    if (!chain) throw new Error('Invalid chainId')

    const account = this.getWallet().account
    if (!account) throw new Error('Invalid signer')

    const txOptions = convertTransactionOptions(options)
    return { chain, ...txOptions, account } // Needs to be in this order to override the `account` if necessary
  }

  getChain(): Chain | undefined {
    return getChainById(this.chainId)
  }

  getAddress: GetAddressFunction = () => {
    return this.contractAddress
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
    const contractOptions = this.convertOptions(options)
    const abi = this.contractAbi as Abi
    const params = args as unknown[]
    return estimateContractGas(this.runner, {
      abi,
      functionName: functionToEstimate,
      address: this.getAddress(),
      args: params,
      ...contractOptions
    })
  }

  getWallet(): WalletClient<Transport, Chain | undefined> {
    if (!this.wallet) throw new Error('A signer must be set')
    return this.wallet
  }

  async write<
    functionName extends ContractFunctionName<ContractAbiType, 'payable' | 'nonpayable'>,
    functionArgs extends ContractFunctionArgs<
      ContractAbiType,
      'payable' | 'nonpayable',
      functionName
    >
  >(functionName: functionName, args: functionArgs, options?: TransactionOptions) {
    const converted = this.convertOptions(options) as any

    return await this.getWallet().writeContract({
      address: this.contractAddress,
      abi: this.contractAbi,
      functionName,
      args,
      ...converted
    })
  }

  async read<
    functionName extends ContractFunctionName<ContractAbiType, 'pure' | 'view'>,
    functionArgs extends ContractFunctionArgs<ContractAbiType, 'pure' | 'view', functionName>
  >(functionName: functionName, args?: functionArgs) {
    return await this.runner.readContract({
      functionName,
      abi: this.contractAbi,
      address: this.contractAddress,
      args
    })
  }
}

export default BaseContract
