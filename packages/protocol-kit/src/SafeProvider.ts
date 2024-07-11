import { generateTypedData, validateEip3770Address } from '@safe-global/protocol-kit/utils'
import { isTypedDataSigner } from '@safe-global/protocol-kit/contracts/utils'
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
  isAddress,
  Transaction,
  decodeAbiParameters,
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  BlockTag,
  Transport,
  Chain
} from 'viem'
import { privateKeyToAccount, Account } from 'viem/accounts'
import { fromSafeProviderTransaction } from '@safe-global/protocol-kit/utils'

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
      const client = createPublicClient({
        transport: custom(provider)
      })
      this.#externalProvider = client
    }

    this.provider = provider
    this.signer = signer ? asHex(signer) : signer
  }

  getExternalProvider(): PublicClient {
    return this.#externalProvider
  }

  async getExternalSigner(): Promise<
    WalletClient<Transport, Chain | undefined, Account> | undefined
  > {
    // If the signer is not an Ethereum address, it should be a private key
    const { transport, chain } = this.getExternalProvider()
    if (this.signer && !this.isAddress(this.signer)) {
      const account = privateKeyToAccount(asHex(this.signer))
      return createWalletClient({
        account,
        chain,
        transport: custom(transport)
      })
    }

    // If we have a signer and its not a pk, it might be a delegate on the rpc levels and this should work with eth_requestAcc
    if (this.signer) {
      return createWalletClient({
        account: asAddress(this.signer),
        chain,
        transport: custom(transport)
      })
    }

    if (transport?.type === 'custom') {
      // This behavior is a reproduction of JsonRpcApiProvider#getSigner (which is super of BrowserProvider).
      // it dispatches and eth_accounts and picks the index 0. https://github.com/ethers-io/ethers.js/blob/a4b1d1f43fca14f2e826e3c60e0d45f5b6ef3ec4/src.ts/providers/provider-jsonrpc.ts#L1119C24-L1119C37
      const wallet = createWalletClient({
        chain,
        transport: custom(transport)
      })

      const [address] = await wallet.getAddresses()
      return createWalletClient({
        account: address,
        transport: custom(transport),
        chain: wallet.chain
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
    return getAddress(asHex(address))
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
    // https://github.com/wevm/viem/blob/963877cd43083260a4399d6f0bbf142ccede53b4/src/actions/public/getCode.ts#L71
    return !!contractCode
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await this.#externalProvider.getStorageAt({
      address: asAddress(address),
      slot: asHex(position)
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
    const externalSigner = await this.getExternalSigner()
    return externalSigner ? getAddress(externalSigner.account.address) : undefined
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
      const { chainId, verifyingContract } = typedData.domain
      const chain = chainId ? Number(chainId) : undefined // ensure empty string becomes undefined
      const domain = { verifyingContract: asAddress(verifyingContract), chainId: chain }

      const signature = await signer.signTypedData({
        domain,
        types:
          typedData.primaryType === 'SafeMessage'
            ? { SafeMessage: (typedData as EIP712TypedDataMessage).types.SafeMessage }
            : { SafeTx: (typedData as EIP712TypedDataTx).types.SafeTx },
        primaryType: typedData.primaryType,
        message: typedData.message
      })
      return signature
    }

    throw new Error('The current signer does not implement EIP-712 to sign typed data')
  }

  async estimateGas(transaction: SafeProviderTransaction): Promise<string> {
    const converted = fromSafeProviderTransaction(transaction)
    return (await this.#externalProvider.estimateGas(converted)).toString()
  }

  async call(transaction: SafeProviderTransaction, blockTag?: string | number): Promise<string> {
    const converted = fromSafeProviderTransaction(transaction)
    const { data } = await this.#externalProvider.call({
      ...converted,
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
