import {
  ethers,
  TransactionResponse,
  AbstractSigner,
  Provider,
  BrowserProvider,
  JsonRpcProvider
} from 'ethers'
import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import {
  EIP712TypedDataMessage,
  EIP712TypedDataTx,
  Eip3770Address,
  SafeEIP712Args
} from '@safe-global/safe-core-sdk-types'
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
import {
  SafeProviderTransaction,
  GetContractProps,
  Eip1193Provider
} from '@safe-global/protocol-kit/types'

export interface SafeProviderConfig {
  /** signerOrProvider - Ethers signer or provider */
  providerOrUrl: Eip1193Provider | string
  signerAddress?: string
  privateKeyOrMnemonic?: string
}

class SafeProvider {
  #provider: BrowserProvider | JsonRpcProvider
  #signerAddress?: string
  #privateKeyOrMnemonic?: string

  constructor({ providerOrUrl, signerAddress, privateKeyOrMnemonic }: SafeProviderConfig) {
    if (typeof providerOrUrl === 'string') {
      this.#provider = new JsonRpcProvider(providerOrUrl)
    } else {
      this.#provider = new BrowserProvider(providerOrUrl)
    }

    this.#privateKeyOrMnemonic = privateKeyOrMnemonic
    this.#signerAddress = signerAddress
  }

  getProvider(): Provider {
    return this.#provider
  }

  async getSigner(): Promise<AbstractSigner | undefined> {
    if (this.#privateKeyOrMnemonic) {
      const privateKeySigner = new ethers.Wallet(this.#privateKeyOrMnemonic, this.#provider)
      return privateKeySigner
    }

    if (this.#signerAddress) {
      return this.#provider.getSigner(this.#signerAddress)
    }

    if (this.#provider instanceof BrowserProvider) {
      return this.#provider.getSigner()
    }

    return undefined
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
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    const signerOrProvider = (await this.getSigner()) || this.#provider
    return getSafeProxyFactoryContractInstance(
      safeVersion,
      this,
      signerOrProvider,
      customContractAddress,
      customContractAbi
    )
  }

  async getMultiSendContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getMultiSendContractInstance(safeVersion, this, customContractAddress, customContractAbi)
  }

  async getMultiSendCallOnlyContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getMultiSendCallOnlyContractInstance(
      safeVersion,
      this,
      customContractAddress,
      customContractAbi
    )
  }

  async getCompatibilityFallbackHandlerContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getCompatibilityFallbackHandlerContractInstance(
      safeVersion,
      this,
      customContractAddress,
      customContractAbi
    )
  }

  async getSignMessageLibContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getSignMessageLibContractInstance(
      safeVersion,
      this,
      customContractAddress,
      customContractAbi
    )
  }

  async getCreateCallContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getCreateCallContractInstance(
      safeVersion,
      this,
      customContractAddress,
      customContractAbi
    )
  }

  async getSimulateTxAccessorContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getSimulateTxAccessorContractInstance(
      safeVersion,
      this,
      customContractAddress,
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
    const signer = await this.getSigner()

    return signer?.getAddress()
  }

  async signMessage(message: string): Promise<string> {
    const signer = await this.getSigner()

    if (!signer) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }
    const messageArray = ethers.getBytes(message)

    return signer.signMessage(messageArray)
  }

  async signTypedData(safeEIP712Args: SafeEIP712Args): Promise<string> {
    const signer = await this.getSigner()

    if (!signer) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
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

  async estimateGas(transaction: SafeProviderTransaction): Promise<string> {
    return (await this.#provider.estimateGas(transaction)).toString()
  }

  call(transaction: SafeProviderTransaction, blockTag?: string | number): Promise<string> {
    return this.#provider.call({ ...transaction, blockTag })
  }

  // TODO: fix anys
  encodeParameters(types: string[], values: any[]): string {
    return new ethers.AbiCoder().encode(types, values)
  }

  decodeParameters(types: string[], values: string): { [key: string]: any } {
    return new ethers.AbiCoder().decode(types, values)
  }
}

export default SafeProvider
