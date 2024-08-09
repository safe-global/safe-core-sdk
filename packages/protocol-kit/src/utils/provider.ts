import { isAddress } from 'viem'

export const isEip1193Provider = (provider: any): boolean => typeof provider !== 'string'
export const isPrivateKey = (signer?: string): boolean => !!signer && !isAddress(signer)
