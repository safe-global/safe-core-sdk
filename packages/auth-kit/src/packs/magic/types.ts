import { MagicSDKAdditionalConfiguration, MagicSDKExtensionsOption } from 'magic-sdk'

export type MagicEvent = string | symbol
export type MagicEventListener = (...args: any[]) => void
export type MagicNetwork = { network: string } | { rpcUrl: string; chainId: number }
export type MagicConfig = {
  txServiceUrl?: string
}
export type MagicInitOptions = {
  apiKey: string
  network?: string | MagicSDKAdditionalConfiguration<string, MagicSDKExtensionsOption<string>>
}
