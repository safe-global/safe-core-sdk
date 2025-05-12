import {
  createPasskeyClient,
  SAFE_FEATURES,
  generateTypedData,
  hasSafeFeature,
  validateEip3770Address,
  toEstimateGasParameters,
  toTransactionRequest,
  sameString
} from '@safe-global/protocol-kit/utils'
import { isEthersSigner } from '@safe-global/protocol-kit/contracts/utils'
import {
  getSafeWebAuthnSignerFactoryContract,
  getSafeWebAuthnSharedSignerContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import {
  EIP712TypedDataMessage,
  EIP712TypedDataTx,
  Eip3770Address,
  SafeEIP712Args
} from '@safe-global/types-kit'
import {
  SafeProviderTransaction,
  SafeProviderConfig,
  SafeProviderInitOptions,
  ExternalClient,
  ExternalSigner,
  Eip1193Provider,
  HttpTransport,
  SocketTransport,
  SafeSigner,
  PasskeyArgType,
  PasskeyClient
} from '@safe-global/protocol-kit/types'
import { DEFAULT_SAFE_VERSION } from './contracts/config'
import { asHash, asHex, getChainById } from './utils/types'
import { asBlockId } from './utils/block'
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  getAddress,
  isAddress,
  Transaction,
  decodeAbiParameters,
  encodeAbiParameters,
  parseAbiParameters,
  toBytes,
  Chain,
  Abi,
  ReadContractParameters,
  ContractFunctionName,
  ContractFunctionArgs,
  walletActions,
  publicActions,
  createClient,
  PublicRpcSchema,
  WalletRpcSchema,
  rpcSchema
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
  call,
  estimateGas,
  getBalance,
  getCode,
  getTransaction,
  getTransactionCount,
  getStorageAt,
  readContract
} from 'viem/actions'
import { isEip1193Provider, isPrivateKey, isSignerPasskeyClient } from './utils/provider'

class SafeProvider {
  #chain?: Chain
  #externalProvider: ExternalClient
  signer?: SafeSigner
  provider: Eip1193Provider | HttpTransport | SocketTransport

  constructor({
    provider,
    signer
  }: {
    provider: SafeProviderConfig['provider']
    signer?: SafeSigner
  }) {
    this.#externalProvider = createPublicClient({
      transport: isEip1193Provider(provider)
        ? custom(provider as Eip1193Provider)
        : http(provider as string)
    })

    this.provider = provider
    this.signer = signer
    this.#chain = undefined
  }

  getExternalProvider(): ExternalClient {
    return this.#externalProvider
  }

  static async init({
    provider,
    signer,
    safeVersion = DEFAULT_SAFE_VERSION,
    contractNetworks,
    safeAddress,
    owners
  }: SafeProviderInitOptions): Promise<SafeProvider> {
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

      if (!isSignerPasskeyClient(signer) && !isEthersSigner(signer)) {
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

        passkeySigner = await createPasskeyClient(
          signer as PasskeyArgType,
          safeWebAuthnSignerFactoryContract,
          safeWebAuthnSharedSignerContract,
          safeProvider.getExternalProvider(),
          safeAddress || '',
          owners || [],
          chainId.toString()
        )
      } else {
        // signer was already initialized and we pass a PasskeyClient instance (reconnecting)
        passkeySigner = signer as PasskeyClient
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

  async getExternalSigner(): Promise<ExternalSigner | undefined> {
    const { transport, chain = await this.#getChain() } = this.getExternalProvider()

    if (isSignerPasskeyClient(this.signer)) {
      return this.signer as PasskeyClient
    }

    // Check for ethers.js signer
    if (isEthersSigner(this.signer)) {
      // Return the ethers.js signer with a compatible interface
      const ethersSignerAddress = (await (this.signer as any).getAddress?.()) || ''

      // Create a minimal viem-like adapter for ethers signer
      return {
        account: {
          address: ethersSignerAddress,
          type: 'json-rpc'
        },
        signTypedData: async (params: any) => {
          try {
            // Ethers v5 style
            if (typeof (this.signer as any)._signTypedData === 'function') {
              return await (this.signer as any)._signTypedData(
                params.domain,
                params.types,
                params.message
              )
            }
            // Ethers v6 style
            else if (typeof (this.signer as any).signTypedData === 'function') {
              // Try object param style first
              try {
                return await (this.signer as any).signTypedData(params)
              } catch {
                // Fallback to separate params
                return await (this.signer as any).signTypedData(
                  params.domain,
                  params.types,
                  params.message
                )
              }
            }
          } catch (error) {
            console.error('Error signing typed data with ethers signer:', error)
            throw error
          }
        },
        signMessage: async (params: any) => {
          const message =
            typeof params.message === 'object' && params.message.raw
              ? new Uint8Array(params.message.raw)
              : params.message

          if (typeof (this.signer as any).signMessage === 'function') {
            return await (this.signer as any).signMessage(message)
          }
          throw new Error('Ethers signer does not implement signMessage')
        }
      } as unknown as ExternalSigner
    }

    if (isPrivateKey(this.signer)) {
      // This is a client with a local account, the account needs to be of type Account as Viem consider strings as 'json-rpc' (on parseAccount)
      const account = privateKeyToAccount(asHex(this.signer as string))
      return createWalletClient({
        account,
        chain,
        transport: custom(transport)
      })
    }

    try {
      // This behavior is a reproduction of JsonRpcApiProvider#getSigner (which is super of BrowserProvider).
      // it dispatches and eth_accounts and picks the index 0. https://github.com/ethers-io/ethers.js/blob/a4b1d1f43fca14f2e826e3c60e0d45f5b6ef3ec4/src.ts/providers/provider-jsonrpc.ts#L1119C24-L1119C37
      const wallet = createWalletClient({
        chain,
        transport: custom(transport)
      })

      const [address] = await wallet.getAddresses()
      if (address) {
        const client = createClient({
          account: address,
          transport: custom(transport),
          chain: wallet.chain,
          rpcSchema: rpcSchema<WalletRpcSchema & PublicRpcSchema>()
        })
          .extend(walletActions)
          .extend(publicActions)
        return client
      }
    } catch {}

    return undefined
  }

  async isPasskeySigner(): Promise<boolean> {
    return isSignerPasskeyClient(this.signer)
  }

  isAddress(address: string): boolean {
    return isAddress(address)
  }

  async getEip3770Address(fullAddress: string): Promise<Eip3770Address> {
    const chainId = await this.getChainId()
    return validateEip3770Address(fullAddress, chainId)
  }

  async getBalance(address: string, blockTag?: string | number): Promise<bigint> {
    return getBalance(this.#externalProvider, {
      address,
      ...asBlockId(blockTag)
    })
  }

  async getNonce(address: string, blockTag?: string | number): Promise<number> {
    return getTransactionCount(this.#externalProvider, {
      address,
      ...asBlockId(blockTag)
    })
  }

  async getChainId(): Promise<bigint> {
    const res = (await this.#getChain()).id
    return BigInt(res)
  }

  getChecksummedAddress(address: string): string {
    return getAddress(address)
  }

  async getContractCode(address: string, blockTag?: string | number): Promise<string> {
    const res = await getCode(this.#externalProvider, {
      address,
      ...asBlockId(blockTag)
    })

    return res ?? '0x'
  }

  async isContractDeployed(address: string, blockTag?: string | number): Promise<boolean> {
    const contractCode = await getCode(this.#externalProvider, {
      address,
      ...asBlockId(blockTag)
    })
    // https://github.com/wevm/viem/blob/963877cd43083260a4399d6f0bbf142ccede53b4/src/actions/public/getCode.ts#L71
    return !!contractCode
  }

  async getStorageAt(address: string, position: string): Promise<string> {
    const content = await getStorageAt(this.#externalProvider, {
      address,
      slot: asHex(position)
    })
    const decodedContent = this.decodeParameters('address', asHex(content))
    return decodedContent[0]
  }

  async getTransaction(transactionHash: string): Promise<Transaction> {
    return getTransaction(this.#externalProvider, {
      hash: asHash(transactionHash)
    })
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

    // The address on the `WalletClient` is the one we are passing so we let Viem make assertions about that account
    // For Viem, in this context a typeof account === 'string' to signMessage is assumed to be a json-rpc account (returned by parseAccount function)
    if (sameString(signer.account.address, account)) {
      return await signer?.signMessage!({
        message: { raw: toBytes(message) }
      })
    } else {
      return await signer?.signMessage!({
        account: account,
        message: { raw: toBytes(message) }
      })
    }
  }

  async signTypedData(safeEIP712Args: SafeEIP712Args): Promise<string> {
    const signer = await this.getExternalSigner()

    if (!signer) {
      throw new Error('SafeProvider must be initialized with a signer to use this method')
    }

    if (isEthersSigner(signer)) {
      const typedData = generateTypedData(safeEIP712Args)
      const { chainId, verifyingContract } = typedData.domain
      const chain = chainId ? Number(chainId) : undefined // ensure empty string becomes undefined
      const domain = { verifyingContract: verifyingContract, chainId: chain }

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
    const converted = toEstimateGasParameters(transaction)
    return (await estimateGas(this.#externalProvider, converted)).toString()
  }

  async call(transaction: SafeProviderTransaction, blockTag?: string | number): Promise<string> {
    const converted = toTransactionRequest(transaction)
    const { data } = await call(this.#externalProvider, {
      ...converted,
      ...asBlockId(blockTag)
    })
    return data ?? '0x'
  }

  async readContract<
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, 'pure' | 'view'>,
    const args extends ContractFunctionArgs<abi, 'pure' | 'view', functionName>
  >(args: ReadContractParameters<abi, functionName, args>) {
    return readContract(this.#externalProvider, args)
  }

  // TODO: fix anys
  encodeParameters(types: string, values: any[]): string {
    return encodeAbiParameters(parseAbiParameters(types), values)
  }

  decodeParameters(types: string, values: string): { [key: string]: any } {
    return decodeAbiParameters(parseAbiParameters(types), asHex(values))
  }

  async #getChain(): Promise<Chain> {
    if (this.#chain) return this.#chain
    const chain = getChainById(BigInt(await this.#externalProvider.getChainId()))
    if (!chain) throw new Error('Invalid chainId')
    this.#chain = chain
    return this.#chain
  }
}

export default SafeProvider
