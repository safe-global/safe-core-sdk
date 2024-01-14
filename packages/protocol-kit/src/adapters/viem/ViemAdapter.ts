import { Address, BlockTag, getAddress, isAddress } from 'viem'
import { validateEip3770Address } from '../..'
import {
  CompatibilityFallbackHandlerContract,
  CreateCallContract,
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeContract,
  SafeProxyFactoryContract,
  SafeTransactionEIP712Args,
  SignMessageLibContract,
  SimulateTxAccessorContract
} from '@safe-global/safe-core-sdk-types'
import {
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance
} from './contracts/contractInstancesViem'
import { ClientPair } from './types'

export class ViemAdapter implements EthAdapter {
  constructor(public readonly config: { client: ClientPair }) {}

  get client() {
    return this.config.client
  }

  isAddress = isAddress

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, BigInt(chainId))
  }

  getBalance(address: Address, defaultBlock?: BlockTag | undefined): Promise<bigint> {
    return this.client.public.getBalance({
      address,
      blockTag: defaultBlock
    })
  }

  getNonce(address: Address, defaultBlock?: BlockTag | undefined): Promise<number> {
    return this.client.public.getTransactionCount({
      address,
      blockTag: defaultBlock
    })
  }

  getChainId(): Promise<bigint> {
    return this.client.public.getChainId().then(BigInt)
  }

  getChecksummedAddress = getAddress

  async getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SafeContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (contractAddress == null) {
      throw new Error('Invalid SafeProxy contract address')
    }
    return getSafeContractInstance(safeVersion, contractAddress as Address, this.client)
  }

  getMultiSendContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendContract> {
    throw new Error('Method not implemented.')
  }

  getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendCallOnlyContract> {
    throw new Error('Method not implemented.')
  }

  getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContract> {
    throw new Error('Method not implemented.')
  }
  async getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SafeProxyFactoryContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (contractAddress == null) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }
    return getSafeProxyFactoryContractInstance(safeVersion, contractAddress as Address, this.client)
  }

  getSignMessageLibContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContract> {
    throw new Error('Method not implemented.')
  }

  getCreateCallContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContract> {
    throw new Error('Method not implemented.')
  }

  getSimulateTxAccessorContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SimulateTxAccessorContract> {
    throw new Error('Method not implemented.')
  }

  getContractCode(address: string, defaultBlock?: string | number | undefined): Promise<string> {
    throw new Error('Method not implemented.')
  }

  isContractDeployed(
    address: string,
    defaultBlock?: string | number | undefined
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  getStorageAt(address: string, position: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  getTransaction(transactionHash: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  getSignerAddress(): Promise<string | undefined> {
    throw new Error('Method not implemented.')
  }

  signMessage(message: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  signTypedData(
    safeTransactionEIP712Args: SafeTransactionEIP712Args,
    signTypedDataVersion?: string | undefined
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  estimateGas(
    transaction: EthAdapterTransaction,
    callback?: ((error: Error, gas: number) => void) | undefined
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  call(
    transaction: EthAdapterTransaction,
    defaultBlock?: string | number | undefined
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  encodeParameters(types: string[], values: any[]): string {
    throw new Error('Method not implemented.')
  }

  decodeParameters(types: any[], values: string): { [key: string]: any } {
    throw new Error('Method not implemented.')
  }
}
