import { isAddress } from 'viem'
import { PASSKEY_CLIENT_KEY } from './passkeys'

export const isEip1193Provider = (provider: any): boolean => typeof provider !== 'string'
export const isPrivateKey = (signer?: any): boolean =>
  typeof signer === 'string' && !isAddress(signer)
export const isSignerPasskeyClient = (signer?: any): boolean =>
  !!signer && signer.key === PASSKEY_CLIENT_KEY
