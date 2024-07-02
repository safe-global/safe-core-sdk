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
import { asAddress, asHash, asHex } from './utils/types'
import {
  createPublicClient,
  createWalletClient,
  WalletClient,
  PublicClient,
  custom,
  http,
  getAddress,
  toHex,
  isAddress,
  Transaction,
  decodeAbiParameters,
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  BlockTag
} from 'viem'
import { privateKeyToAccount, privateKeyToAddress } from 'viem/accounts'

function asBlockId(blockId: number | string | undefined) {
  return typeof blockId === 'number' ? blockNumber(blockId) : blockTag(blockId)
}

function blockNumber(blockNumber: any) {
  return { blockNumber: blockNumber.toNumber() }
}

function blockTag(blockTag: any) {
  return { blockTag: blockTag as BlockTag }
}

class SafeProvider {
  #externalProvider: PublicClient
  signer?: string
  provider: Eip1193Provider | HttpTransport | SocketTransport

  constructor({ provider, signer }: SafeProviderConfig) {
    if (typeof provider === 'string') {
      this.#externalProvider = createPublicClient({
        transport: http(provider)
      })
    } else {
      this.#externalProvider = createPublicClient({
        transport: custom(provider)
      })
    }

    this.provider = provider
    this.signer = signer
  }

  getExternalProvider(): PublicClient {
    return this.#externalProvider
  }

  async getExternalSigner(): Promise<WalletClient | undefined> {
    // If the signer is not an Ethereum address, it should be a private key
    if (this.signer && !this.isAddress(this.signer)) {
      const account = privateKeyToAccount(asHex(this.signer))
      const { transport, chain } = this.getExternalProvider()
      return createWalletClient({
        account,
        chain,
        transport: custom(transport)
      })
    }

    // If we have a signer and its not a pk, it might be a delegate on the rpc levels and this should work with eth_requestAcc
    if (this.signer) {
      const { chain, transport } = this.getExternalProvider()
      return createWalletClient({
        chain,
        transport: custom(transport)
      })
    }
    return undefined
  }

  isAddress(address: string): boolean {
    return isAddress(address)
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string, blockTag?: string | number): Promise<bigint> {
    return this.#externalProvider.getBalance({
      address: asAddress(address),
      ...asBlockId(blockTag)
    })
  }

  async getNonce(address: string, blockTag?: string | number): Promise<number> {
    return this.#externalProvider.getTransactionCount({
      address: asAddress(address),
      ...asBlockId(blockTag)
    })
  }

  async getChainId(): Promise<bigint> {
    const res = await this.#externalProvider.getChainId()
    return BigInt(res)
  }

  getChecksummedAddress(address: string): string {
    return getAddress(address)
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
    const signerOrProvider = this.#externalProvider
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
    const res = this.#externalProvider.getCode({
      address: asAddress(address),
      ...asBlockId(blockTag)
    })
    return res?.toString()
  }

  async isContractDeployed(address: string, blockTag?: string | number): Promise<boolean> {
    const contractCode = await this.#externalProvider.getCode({
      address: asAddress(address),
      ...asBlockId(blockTag)
    })
    return contractCode !== EMPTY_DATA
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#externalProvider.getStorageAt({
      address: asAddress(address),
      slot: toHex(position)
    })
    const decodedContent = this.decodeParameters('address', asHex(content))
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    return this.#externalProvider.getTransaction({
      hash: asHash(transactionHash)
    }) as Promise<Transaction>
  }

  async getSignerAddress(): Promise<string | undefined> {
    if (this.signer && !isAddress(this.signer)) {
      return privateKeyToAddress(asHex(this.signer))
    }

    return this.signer
  }

  async signMessage(message: string): Promise<string> {
    const signer = await this.getExternalSigner()
    const account = await this.getSignerAddress()

    if (!signer || !account) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }

    return (await signer?.signMessage!({
      account: asHex(account),
      message: { raw: toBytes(message) }
    })) as string
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
    const anyTransaction = transaction as any
    return (await this.#externalProvider.estimateGas(anyTransaction)).toString()
  }

  async call(transaction: SafeProviderTransaction, blockTag?: string | number): Promise<string> {
    const anyTransaction = transaction as any
    const { data } = await this.#externalProvider.call({
      ...anyTransaction,
      ...asBlockId(blockTag)
    })
    return data ?? '0x'
  }

  // TODO: fix anys
  encodeParameters(types: string, values: any[]): string {
    return encodeAbiParameters(parseAbiParameters(types), values)
  }

  decodeParameters(types: string, values: string): { [key: string]: any } {
    return decodeAbiParameters(parseAbiParameters(types), asHex(values))
  }
}

export default SafeProvider
