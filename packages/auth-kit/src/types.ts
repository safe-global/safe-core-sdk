type JsonRpcRequest = {
  jsonrpc: string
  id: number
  method: string
  params: unknown[]
}

type JsonRpcError = {
  code: number
  message: string
  data?: unknown
}

interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: unknown
  error?: JsonRpcError
}

export type AuthKitEthereumProvider = {
  sendAsync(
    payload: JsonRpcRequest,
    callback: (error: JsonRpcError | null, result: JsonRpcResponse) => void
  ): void

  send(
    payload: JsonRpcRequest,
    callback: (error: JsonRpcError | null, result: unknown) => void
  ): void

  request(payload: JsonRpcRequest): Promise<JsonRpcResponse>
}

export type AuthKitSignInData = {
  eoa: string
  safes?: string[]
}
