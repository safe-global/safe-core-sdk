import { MagicSDKAdditionalConfiguration, MagicSDKExtensionsOption } from 'magic-sdk'

export const MAGIC_EVENT_CONNECTED = 'CONNECTED'
export const MAGIC_EVENT_DISCONNECTED = 'DISCONNECTED'

export type MagicEvent = typeof MAGIC_EVENT_CONNECTED | typeof MAGIC_EVENT_DISCONNECTED
export type MagicEventListener = (...args: any[]) => void
export type MagicNetwork = { network: string } | { rpcUrl: string; chainId: number }
export type MagicConfig = {
  txServiceUrl?: string
}
export type MagicInitOptions = {
  apiKey: string
  options?: MagicSDKAdditionalConfiguration<string, MagicSDKExtensionsOption<string>>
}
