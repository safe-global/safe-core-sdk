import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import {
  EIP712TypedDataMessage,
  EIP712TypedDataTx,
  Eip3770Address,
  EthAdapter,
  EthAdapterTransaction,
  GetContractProps,
  SafeEIP712Args
} from '@safe-global/safe-core-sdk-types'
import { ethers, TransactionResponse, AbstractSigner, Provider } from 'ethers'
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

  async getChainId(): Promise<bigint> {
    return (await this.#provider.getNetwork()).chainId
  }

  getChecksummedAddress(address: string): string {
    return this.#ethers.getAddress(address)
  }

  async getSafeContract({
    safeVersion,
    customContractAddress,
    customContractAbi,
    isL1SafeSingleton
  }: GetContractProps) {
    return getSafeContractInstance(
      safeVersion,
      this,
      customContractAddress,
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
  }: GetContractProps) {
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
  }: GetContractProps) {
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
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    const chainId = await this.getChainId()
    const contractAddress =
      customContractAddress ?? singletonDeployment?.networkAddresses[chainId.toString()]
    if (!contractAddress) {
      throw new Error('Invalid CompatibilityFallbackHandler contract address')
    }
    return getCompatibilityFallbackHandlerContractInstance(
      safeVersion,
      contractAddress,
      this,
      customContractAbi
    )
  }

  async getSignMessageLibContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
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
  }: GetContractProps) {
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
  }: GetContractProps) {
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
    return this.#signer?.getAddress()
  }

  signMessage(message: string): Promise<string> {
    if (!this.#signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const messageArray = this.#ethers.getBytes(message)
    return this.#signer.signMessage(messageArray)
  }

  async signTypedData(safeEIP712Args: SafeEIP712Args): Promise<string> {
    if (!this.#signer) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    if (isTypedDataSigner(this.#signer)) {
      const typedData = generateTypedData(safeEIP712Args)
      const signature = await this.#signer.signTypedData(
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

  // TODO: fix anys
  encodeParameters(types: string[], values: any[]): string {
    return new this.#ethers.AbiCoder().encode(types, values)
  }

  decodeParameters(types: string[], values: string): { [key: string]: any } {
    return new this.#ethers.AbiCoder().decode(types, values)
  }
}

export default EthersAdapter
