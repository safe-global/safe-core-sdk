import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import {
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeTransactionEIP712Args
} from '@safe-global/safe-core-sdk-types'
import { ethers, TransactionResponse, AbstractSigner, Provider } from 'ethers'
import CompatibilityFallbackHandlerContractEthers from './contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerEthersContract'
import CreateCallEthersContract from './contracts/CreateCall/CreateCallEthersContract'
import MultiSendEthersContract from './contracts/MultiSend/MultiSendEthersContract'
import MultiSendCallOnlyEthersContract from './contracts/MultiSendCallOnly/MultiSendCallOnlyEthersContract'
import SafeContractEthers from './contracts/Safe/SafeContractEthers'
import SafeProxyFactoryEthersContract from './contracts/SafeProxyFactory/SafeProxyFactoryEthersContract'
import SignMessageLibEthersContract from './contracts/SignMessageLib/SignMessageLibEthersContract'
import SimulateTxAccessorEthersContract from './contracts/SimulateTxAccessor/SimulateTxAccessorEthersContract'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getCreateCallContractInstance,
  getMultiSendCallOnlyContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSignMessageLibContractInstance,
  getSimulateTxAccessorContractInstance
} from './contracts/contractInstancesEthers'
import { isTypedDataSigner, isSignerCompatible } from './utils'

type Ethers = typeof ethers

export interface EthersAdapterConfig {
  /** ethers - Ethers v6 library */
  ethers: Ethers
  /** signerOrProvider - Ethers signer or provider */
  signerOrProvider: AbstractSigner | Provider
}

class EthersAdapter implements EthAdapter {
  #ethers: Ethers
  #signer?: AbstractSigner
  #provider: Provider

  constructor({ ethers, signerOrProvider }: EthersAdapterConfig) {
    if (!ethers) {
      throw new Error('ethers property missing from options')
    }
    this.#ethers = ethers
    const isSigner = isSignerCompatible(signerOrProvider)
    if (isSigner) {
      const signer = signerOrProvider as AbstractSigner
      if (!signer.provider) {
        throw new Error('Signer must be connected to a provider')
      }
      this.#provider = signer.provider
      this.#signer = signer
    } else {
      this.#provider = signerOrProvider as Provider
    }
  }

  getProvider(): Provider {
    return this.#provider
  }

  getSigner(): AbstractSigner | undefined {
    return this.#signer
  }

  isAddress(address: string): boolean {
    return this.#ethers.isAddress(address)
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string, blockTag?: string | number): Promise<bigint> {
    return this.#provider.getBalance(address, blockTag)
  }

  async getNonce(address: string, blockTag?: string | number): Promise<number> {
    return this.#provider.getTransactionCount(address, blockTag)
  }

  async getChainId(): Promise<number> {
    return Number((await this.#provider.getNetwork()).chainId)
  }

  getChecksummedAddress(address: string): string {
    return this.#ethers.getAddress(address)
  }

  async getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SafeContractEthers> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxy contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSafeContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SafeProxyFactoryEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSafeProxyFactoryContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getMultiSendContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<MultiSendEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid MultiSend contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getMultiSendContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<MultiSendCallOnlyEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid MultiSendCallOnly contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getMultiSendCallOnlyContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContractEthers> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid CompatibilityFallbackHandler contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getCompatibilityFallbackHandlerContractInstance(
      safeVersion,
      contractAddress,
      signerOrProvider
    )
  }

  async getSignMessageLibContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SignMessageLibEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SignMessageLib contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSignMessageLibContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getCreateCallContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<CreateCallEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid CreateCall contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getCreateCallContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getSimulateTxAccessorContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<SimulateTxAccessorEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress = customContractAddress ?? singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid SimulateTxAccessor contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSimulateTxAccessorContractInstance(safeVersion, contractAddress, signerOrProvider)
  }

  async getContractCode(address: string, blockTag?: string | number): Promise<string> {
    return this.#provider.getCode(address, blockTag)
  }

  async isContractDeployed(address: string, blockTag?: string | number): Promise<boolean> {
    const contractCode = await this.#provider.getCode(address, blockTag)
    return contractCode !== '0x'
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#provider.getStorage(address, position)
    const decodedContent = this.decodeParameters(['address'], content)
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.#provider.getTransaction(transactionHash) as Promise<TransactionResponse>
  }

  async getSignerAddress(): Promise<string | undefined> {
    return this.#signer?.getAddress()
  }

  signMessage(message: string): Promise<string> {
    if (!this.#signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const messageArray = this.#ethers.getBytes(message)
    return this.#signer.signMessage(messageArray)
  }

  async signTypedData(safeTransactionEIP712Args: SafeTransactionEIP712Args): Promise<string> {
    if (!this.#signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    if (isTypedDataSigner(this.#signer)) {
      const typedData = generateTypedData(safeTransactionEIP712Args)
      const signature = await this.#signer.signTypedData(
        typedData.domain,
        { SafeTx: typedData.types.SafeTx },
        typedData.message
      )
      return signature
    }
    throw new Error('The current signer does not implement EIP-712 to sign typed data')
  }

  async estimateGas(transaction: EthAdapterTransaction): Promise<string> {
    return (await this.#provider.estimateGas(transaction)).toString()
  }

  call(transaction: EthAdapterTransaction, blockTag?: string | number): Promise<string> {
    return this.#provider.call({ ...transaction, blockTag })
  }

  encodeParameters(types: string[], values: any[]): string {
    return new this.#ethers.AbiCoder().encode(types, values)
  }

  decodeParameters(types: string[], values: string): { [key: string]: any } {
    return new this.#ethers.AbiCoder().decode(types, values)
  }
}

export default EthersAdapter
