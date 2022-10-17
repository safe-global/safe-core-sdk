import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'
import {
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeTransactionEIP712Args
} from '@gnosis.pm/safe-core-sdk-types'
import { generateTypedData, validateEip3770Address } from '@gnosis.pm/safe-core-sdk-utils'
import CreateCallEthersContract from 'contracts/CreateCall/CreateCallEthersContract'
import { ethers } from 'ethers'
import {
  getCreateCallContractInstance,
  getMultiSendCallOnlyContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance
} from './contracts/contractInstancesEthers'
import GnosisSafeContractEthers from './contracts/GnosisSafe/GnosisSafeContractEthers'
import GnosisSafeProxyFactoryEthersContract from './contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersContract'
import MultiSendEthersContract from './contracts/MultiSend/MultiSendEthersContract'
import MultiSendCallOnlyEthersContract from './contracts/MultiSendCallOnly/MultiSendCallOnlyEthersContract'
import { isTypedDataSigner } from './utils'

type Ethers = typeof ethers

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: Ethers
  /** signer - Ethers signer */
  signer: Signer
}

class EthersAdapter implements EthAdapter {
  #ethers: Ethers
  #signer: Signer
  #provider: Provider

  constructor({ ethers, signer }: EthersAdapterConfig) {
    if (!ethers) {
      throw new Error('ethers property missing from options')
    }
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#provider = signer.provider
    this.#ethers = ethers
  }

  getProvider(): Provider {
    return this.#provider
  }

  getSigner(): Signer {
    return this.#signer
  }

  isAddress(address: string): boolean {
    return this.#ethers.utils.isAddress(address)
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string, blockTag?: string | number): Promise<BigNumber> {
    return BigNumber.from(await this.#provider.getBalance(address, blockTag))
  }

  async getNonce(address: string, blockTag?: string | number): Promise<number> {
    return this.#provider.getTransactionCount(address, blockTag)
  }

  async getChainId(): Promise<number> {
    return (await this.#provider.getNetwork()).chainId
  }

  getChecksummedAddress(address: string): string {
    return this.#ethers.utils.getAddress(address)
  }

  getSafeContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): GnosisSafeContractEthers {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxy contract address')
    }
    return getSafeContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getMultiSendContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): MultiSendEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid MultiSend contract address')
    }
    return getMultiSendContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getMultiSendCallOnlyContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): MultiSendCallOnlyEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid MultiSendCallOnly contract address')
    }
    return getMultiSendCallOnlyContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): GnosisSafeProxyFactoryEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }
    return getSafeProxyFactoryContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getCreateCallContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): CreateCallEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid CreateCall contract address')
    }
    return getCreateCallContractInstance(safeVersion, contractAddress, this.#signer)
  }

  async getContractCode(address: string, blockTag?: string | number): Promise<string> {
    return this.#provider.getCode(address, blockTag)
  }

  async isContractDeployed(address: string, blockTag?: string | number): Promise<boolean> {
    const contractCode = await this.#provider.getCode(address, blockTag)
    return contractCode !== '0x'
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#provider.getStorageAt(address, position)
    const decodedContent = this.decodeParameters(['address'], content)
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.#provider.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string> {
    return this.#signer.getAddress()
  }

  signMessage(message: string): Promise<string> {
    const messageArray = this.#ethers.utils.arrayify(message)
    return this.#signer.signMessage(messageArray)
  }

  async signTypedData(safeTransactionEIP712Args: SafeTransactionEIP712Args): Promise<string> {
    if (isTypedDataSigner(this.#signer)) {
      const typedData = generateTypedData(safeTransactionEIP712Args)
      const signature = await this.#signer._signTypedData(
        typedData.domain,
        { SafeTx: typedData.types.SafeTx },
        typedData.message
      )
      return signature
    }
    throw new Error('The current signer does not implement EIP-712 to sign typed data')
  }

  async estimateGas(transaction: EthAdapterTransaction): Promise<number> {
    return (await this.#provider.estimateGas(transaction)).toNumber()
  }

  call(transaction: EthAdapterTransaction, blockTag?: string | number): Promise<string> {
    return this.#provider.call(transaction, blockTag)
  }

  encodeParameters(types: string[], values: any[]): string {
    return new this.#ethers.utils.AbiCoder().encode(types, values)
  }

  decodeParameters(types: string[], values: string): { [key: string]: any } {
    return new this.#ethers.utils.AbiCoder().decode(types, values)
  }
}

export default EthersAdapter
