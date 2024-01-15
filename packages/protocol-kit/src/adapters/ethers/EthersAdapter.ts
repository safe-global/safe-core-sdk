import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import {
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeTransactionEIP712Args,
  SignMessageLibContract
} from '@safe-global/safe-core-sdk-types'
import { ethers, TransactionResponse, AbstractSigner, Provider } from 'ethers'
import CompatibilityFallbackHandlerContractEthers from './contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerEthersContract'
import CreateCallEthersContract from './contracts/CreateCall/CreateCallEthersContract'
import SafeContractEthers from './contracts/Safe/SafeContractEthers'
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
import MultiSendCallOnlyContract_v1_3_0_Ethers from './contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_v1_4_1_Ethers from './contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Ethers'
import MultiSendContract_v1_1_1_Ethers from './contracts/MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_v1_3_0_Ethers from './contracts/MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendContract_v1_4_1_Ethers from './contracts/MultiSend/v1.4.1/MultiSendContract_V1_4_1_Ethers'

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

  async getChainId(): Promise<bigint> {
    return (await this.#provider.getNetwork()).chainId
  }

  getChecksummedAddress(address: string): string {
    return this.#ethers.getAddress(address)
  }

  async getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi,
    isL1SafeSingleton
  }: GetContractProps): Promise<SafeContractEthers> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxy contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSafeContractInstance(
      safeVersion,
      contractAddress,
      signerOrProvider,
      this,
      customContractAbi,
      isL1SafeSingleton
    )
  }

  async getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }
    const signerOrProvider = this.#signer || this.#provider
    return getSafeProxyFactoryContractInstance(
      safeVersion,
      contractAddress,
      signerOrProvider,
      this,
      customContractAbi
    )
  }

  async getMultiSendContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<
    | MultiSendContract_v1_4_1_Ethers
    | MultiSendContract_v1_3_0_Ethers
    | MultiSendContract_v1_1_1_Ethers
  > {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid MultiSend contract address')
    }

    return getMultiSendContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<
    MultiSendCallOnlyContract_v1_4_1_Ethers | MultiSendCallOnlyContract_v1_3_0_Ethers
  > {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid MultiSendCallOnly contract address')
    }
    return getMultiSendCallOnlyContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  async getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContractEthers> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
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
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SignMessageLib contract address')
    }

    return getSignMessageLibContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getCreateCallContract({
    safeVersion,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): Promise<CreateCallEthersContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
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
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
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
