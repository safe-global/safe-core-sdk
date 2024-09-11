import { EIP1193Provider } from 'viem'

// We want to use a specific auth-kit type and avoid to return external library types in the abstract base pack class
// If we decide to change the external library, we will only need to change the type in this file
export type AuthKitEthereumProvider = EIP1193Provider

export type AuthKitSignInData = {
  eoa: string
  safes?: string[]
}
