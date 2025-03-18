import { PasskeyArgType, PasskeyCoordinates } from './passkeys'
import {
  Account,
  Chain,
  PublicClient,
  Transport,
  WalletClient,
  WalletRpcSchema,
  Client,
  WalletActions,
  Hex,
  Address
} from 'viem'
import { SafeVersion } from '@safe-global/types-kit'
import { ContractNetworksConfig } from '@safe-global/protocol-kit/types'

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export type Eip1193Provider = {
  request: (args: RequestArguments) => Promise<unknown>
}

export type GetPasskeyType = {
  address: string
  rawId: string
  coordinates: PasskeyCoordinates
  verifierAddress: string
}

export type PasskeyActions = {
  createDeployTxRequest: () => { to: Address; value: string; data: Hex }
  encodeCreateSigner: () => Hex
  encodeConfigure: () => Hex
}

export type PasskeyClient = Client<
  Transport,
  Chain | undefined,
  Account,
  WalletRpcSchema,
  WalletActions<Chain | undefined, Account> & PasskeyActions
>

export type ExternalSigner = WalletClient<Transport, Chain | undefined, Account> | PasskeyClient
export type ExternalClient = PublicClient | (ExternalSigner & PublicClient)

export type PrivateKey = string
export type HttpTransport = string
export type SocketTransport = string
export type SafeSigner = Address | PrivateKey | PasskeyArgType | PasskeyClient

export type SafeProviderConfig = {
  /** signerOrProvider - Ethers signer or provider */
  provider: Eip1193Provider | HttpTransport | SocketTransport
  signer?: Address | PrivateKey | PasskeyArgType | PasskeyClient
}

export type SafeProviderInitOptions = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  safeVersion?: SafeVersion
  contractNetworks?: ContractNetworksConfig
  safeAddress?: Address
  owners?: Address[]
}

export type SafeProviderTransaction = {
  to: Address
  from: Address
  data: string
  value?: string
  gasPrice?: number | string
  gasLimit?: number | string | bigint
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export type SafeModulesPaginated = {
  modules: string[]
  next: string
}
