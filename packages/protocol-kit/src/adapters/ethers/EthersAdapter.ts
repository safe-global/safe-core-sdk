import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import {
  CreateCallContract,
  EIP712TypedDataMessage,
  EIP712TypedDataTx,
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeEIP712Args,
  SignMessageLibContract,
  SimulateTxAccessorContract
} from '@safe-global/safe-core-sdk-types'
import { ethers, TransactionResponse, AbstractSigner, Provider, BrowserProvider } from 'ethers'
import CompatibilityFallbackHandlerContractEthers from './contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerEthersContract'
import SafeContractEthers from './contracts/Safe/SafeContractEthers'
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
import { isTypedDataSigner } from './utils'
import MultiSendCallOnlyContract_v1_3_0_Ethers from './contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_v1_4_1_Ethers from './contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_V1_4_1_Ethers'
import MultiSendContract_v1_1_1_Ethers from './contracts/MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_v1_3_0_Ethers from './contracts/MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendContract_v1_4_1_Ethers from './contracts/MultiSend/v1.4.1/MultiSendContract_V1_4_1_Ethers'
import { Eip1193Provider } from '@safe-global/protocol-kit/types'

export interface EthersAdapterConfig {
  /** signerOrProvider - Ethers signer or provider */
  provider: Eip1193Provider
}

class EthersAdapter implements EthAdapter {
  get #signer(): Promise<AbstractSigner | undefined> {
    return this.#provider.getSigner()
  }

  #provider: BrowserProvider
  #eip1193Provider: Eip1193Provider

  constructor({ provider }: EthersAdapterConfig) {
    this.#provider = new BrowserProvider(provider)
    this.#eip1193Provider = provider
  }

  getProvider(): Provider {
    return this.#provider
  }

  getSigner(): Promise<AbstractSigner | undefined> {
    return this.#signer
  }

  isAddress(address: string): boolean {
    return ethers.isAddress(address)
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
    return ethers.getAddress(address)
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
    return getSafeContractInstance(
      safeVersion,
      contractAddress,
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
    const signerOrProvider = (await this.#signer) || this.#provider
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
    const signerOrProvider = (await this.#signer) || this.#provider
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
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid CreateCall contract address')
    }
    return getCreateCallContractInstance(safeVersion, contractAddress, this, customContractAbi)
  }

  async getSimulateTxAccessorContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SimulateTxAccessorContract> {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid SimulateTxAccessor contract address')
    }
    return getSimulateTxAccessorContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
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
    const signer = await this.#signer

    return signer?.getAddress()
  }

  async signMessage(message: string): Promise<string> {
    const signer = await this.#signer

    if (!signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const messageArray = ethers.getBytes(message)

    return signer.signMessage(messageArray)
  }

  async signTypedData(safeEIP712Args: SafeEIP712Args): Promise<string> {
    const signer = await this.#signer

    if (!signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }

    if (isTypedDataSigner(signer)) {
      const typedData = generateTypedData(safeEIP712Args)
      const signature = await signer.signTypedData(
        typedData.domain,
        typedData.primaryType === 'SafeMessage'
          ? { SafeMessage: (typedData as EIP712TypedDataMessage).types.SafeMessage }
          : { SafeTx: (typedData as EIP712TypedDataTx).types.SafeTx },
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
    return new ethers.AbiCoder().encode(types, values)
  }

  decodeParameters(types: string[], values: string): { [key: string]: any } {
    return new ethers.AbiCoder().decode(types, values)
  }
}

export default EthersAdapter
