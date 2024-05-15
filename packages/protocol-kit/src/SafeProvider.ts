import {
  ethers,
  TransactionResponse,
  AbstractSigner,
  Provider,
  BrowserProvider,
  JsonRpcProvider
} from 'ethers'
import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import { isTypedDataSigner } from '@safe-global/protocol-kit/contracts/utils'
import { EMPTY_DATA } from '@safe-global/protocol-kit/utils/constants'

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
} from './contracts/contractInstances'
import {
  SafeProviderTransaction,
  GetContractProps,
  SafeProviderConfig,
  Eip1193Provider,
  HttpTransport,
  SocketTransport
} from '@safe-global/protocol-kit/types'

class SafeProvider {
  #externalProvider: BrowserProvider | JsonRpcProvider
  signer?: string
  provider: Eip1193Provider | HttpTransport | SocketTransport

  constructor({ provider, signer }: SafeProviderConfig) {
    if (typeof provider === 'string') {
      this.#externalProvider = new JsonRpcProvider(provider)
    } else {
      this.#externalProvider = new BrowserProvider(provider)
    }

    this.provider = provider
    this.signer = signer
  }

  getExternalProvider(): Provider {
    return this.#externalProvider
  }

  async getExternalSigner(): Promise<AbstractSigner | undefined> {
    // If the signer is not an Ethereum address, it should be a private key
    if (this.signer && !ethers.isAddress(this.signer)) {
      const privateKeySigner = new ethers.Wallet(this.signer, this.#externalProvider)
      return privateKeySigner
    }

    if (this.signer) {
      return this.#externalProvider.getSigner(this.signer)
    }

    if (this.#externalProvider instanceof BrowserProvider) {
      return this.#externalProvider.getSigner()
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
    return this.#externalProvider.getBalance(address, blockTag)
  }

  async getNonce(address: string, blockTag?: string | number): Promise<number> {
    return this.#externalProvider.getTransactionCount(address, blockTag)
  }

  async getChainId(): Promise<bigint> {
    return (await this.#externalProvider.getNetwork()).chainId
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
    const signerOrProvider = (await this.getExternalSigner()) || this.#externalProvider
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
    return this.#externalProvider.getCode(address, blockTag)
  }

  async isContractDeployed(address: string, blockTag?: string | number): Promise<boolean> {
    const contractCode = await this.#externalProvider.getCode(address, blockTag)
    return contractCode !== EMPTY_DATA
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#externalProvider.getStorage(address, position)
    const decodedContent = this.decodeParameters(['address'], content)
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.#externalProvider.getTransaction(transactionHash) as Promise<TransactionResponse>
  }

  async getSignerAddress(): Promise<string | undefined> {
    const signer = await this.getExternalSigner()

    return signer?.getAddress()
  }

  async signMessage(message: string): Promise<string> {
    const signer = await this.getExternalSigner()

    if (!signer) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }
    const messageArray = ethers.getBytes(message)

    return signer.signMessage(messageArray)
  }

  async signTypedData(safeEIP712Args: SafeEIP712Args): Promise<string> {
    const signer = await this.getExternalSigner()

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
    return (await this.#externalProvider.estimateGas(transaction)).toString()
  }

  call(transaction: SafeProviderTransaction, blockTag?: string | number): Promise<string> {
    return this.#externalProvider.call({ ...transaction, blockTag })
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
