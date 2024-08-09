import {
  ethers,
  TransactionResponse,
  AbstractSigner,
  Provider,
  BrowserProvider,
  JsonRpcProvider
} from 'ethers'
import {
  SAFE_FEATURES,
  generateTypedData,
  hasSafeFeature,
  validateEip3770Address
} from '@safe-global/protocol-kit/utils'
import { isTypedDataSigner } from '@safe-global/protocol-kit/contracts/utils'
import {
  getSafeWebAuthnSharedSignerContract,
  getSafeWebAuthnSignerFactoryContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { EMPTY_DATA } from '@safe-global/protocol-kit/utils/constants'

import {
  EIP712TypedDataMessage,
  EIP712TypedDataTx,
  Eip3770Address,
  SafeEIP712Args,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getCreateCallContractInstance,
  getMultiSendCallOnlyContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSafeWebAuthnSharedSignerContractInstance,
  getSafeWebAuthnSignerFactoryContractInstance,
  getSignMessageLibContractInstance,
  getSimulateTxAccessorContractInstance
} from './contracts/contractInstances'
import {
  SafeProviderTransaction,
  GetContractProps,
  SafeProviderConfig,
  SafeSigner,
  SafeConfig,
  ContractNetworksConfig
} from '@safe-global/protocol-kit/types'
import PasskeySigner from './utils/passkeys/PasskeySigner'
import { DEFAULT_SAFE_VERSION } from './contracts/config'

class SafeProvider {
  #externalProvider: BrowserProvider | JsonRpcProvider
  provider: SafeProviderConfig['provider']
  signer?: SafeSigner

  constructor({
    provider,
    signer
  }: {
    provider: SafeProviderConfig['provider']
    signer?: SafeSigner
  }) {
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

  static async init(
    provider: SafeConfig['provider'],
    signer?: SafeConfig['signer'],
    safeVersion: SafeVersion = DEFAULT_SAFE_VERSION,
    contractNetworks?: ContractNetworksConfig,
    safeAddress?: string,
    owners?: string[]
  ): Promise<SafeProvider> {
    const isPasskeySigner = signer && typeof signer !== 'string'

    if (isPasskeySigner) {
      if (!hasSafeFeature(SAFE_FEATURES.PASSKEY_SIGNER, safeVersion)) {
        throw new Error(
          'Current version of the Safe does not support the Passkey signer functionality'
        )
      }

      const safeProvider = new SafeProvider({
        provider
      })
      const chainId = await safeProvider.getChainId()
      const customContracts = contractNetworks?.[chainId.toString()]

      let passkeySigner
      const isPasskeySignerConfig = !(signer instanceof PasskeySigner)

      if (isPasskeySignerConfig) {
        // signer is type PasskeyArgType {rawId, coordinates, customVerifierAddress? }
        const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
          safeProvider,
          safeVersion,
          customContracts
        })

        const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContract({
          safeProvider,
          safeVersion,
          customContracts
        })

        passkeySigner = await PasskeySigner.init(
          signer,
          safeWebAuthnSignerFactoryContract,
          safeWebAuthnSharedSignerContract,
          safeProvider.getExternalProvider(),
          safeAddress || '',
          owners || [],
          chainId.toString()
        )
      } else {
        // signer was already initialized and we pass a PasskeySigner instance (reconnecting)
        passkeySigner = signer
      }

      return new SafeProvider({
        provider,
        signer: passkeySigner
      })
    } else {
      return new SafeProvider({
        provider,
        signer
      })
    }
  }

  async getExternalSigner(): Promise<AbstractSigner | undefined> {
    if (typeof this.signer === 'string') {
      // If the signer is not an Ethereum address, it should be a private key
      if (!ethers.isAddress(this.signer)) {
        const privateKeySigner = new ethers.Wallet(this.signer, this.#externalProvider)
        return privateKeySigner
      }

      return this.#externalProvider.getSigner(this.signer)
    } else {
      if (this.signer) {
        return this.signer
      }
    }

    if (this.#externalProvider instanceof BrowserProvider) {
      return this.#externalProvider.getSigner()
    }

    return undefined
  }

  async isPasskeySigner(): Promise<boolean> {
    const signer = (await this.getExternalSigner()) as PasskeySigner

    return signer && !!signer.passkeyRawId
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

  async getSafeWebAuthnSignerFactoryContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getSafeWebAuthnSignerFactoryContractInstance(
      safeVersion,
      this,
      customContractAddress,
      customContractAbi
    )
  }

  async getSafeWebAuthnSharedSignerContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps) {
    return getSafeWebAuthnSharedSignerContractInstance(
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
