export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export type Eip1193Provider = {
  request: (args: RequestArguments) => Promise<unknown>
}

export type HexAddress = string
export type PrivateKey = string
export type HttpTransport = string
export type SocketTransport = string
export type SafeSigner = HexAddress | PrivateKey

export type SafeProviderConfig = {
  /** signerOrProvider - Ethers signer or provider */
  provider: Eip1193Provider | HttpTransport | SocketTransport
  signer?: HexAddress | PrivateKey
}

export type SafeProviderTransaction = {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number | string
  gasLimit?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export type SafeModulesPaginated = {
  modules: string[]
  next: string
}
