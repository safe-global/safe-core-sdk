import { Address, BlockTag, Hash, getAddress, isAddress } from 'viem'
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
import { Hex } from 'viem'

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

  async getContractCode(address: string, defaultBlock?: string | number | undefined): Promise<Hex> {
    return this.client.public
      .getBytecode({
        address: address as Address,
        blockNumber: defaultBlock == null ? undefined : BigInt(defaultBlock)
      })
      .then((res) => res ?? '0x')
  }

  async isContractDeployed(
    address: string,
    defaultBlock?: string | number | undefined
  ): Promise<boolean> {
    return this.getContractCode(address, defaultBlock).then((code) => code !== '0x')
  }

  getStorageAt(address: string, position: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  getTransaction(transactionHash: string) {
    return this.client.public.getTransaction({
      hash: transactionHash as Hash
    })
  }

  async getSignerAddress() {
    return this.client.wallet.account.address
  }

  signMessage(message: string): Promise<string> {
    return this.client.wallet.signMessage({
      message: message
    })
  }

  signTypedData(
    safeTransactionEIP712Args: SafeTransactionEIP712Args,
    signTypedDataVersion?: string | undefined
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async estimateGas(transaction: EthAdapterTransaction) {
    return this.client.public
      .estimateGas({
        to: transaction.to as Address,
        account: transaction.from as Address,
        data: transaction.data as Hex,
        value: transaction.value == null ? undefined : BigInt(transaction.value),
        gasPrice: transaction.gasPrice == null ? undefined : BigInt(transaction.gasPrice),
        gas: transaction.gasLimit == null ? undefined : BigInt(transaction.gasLimit)
      })
      .then(String)
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
