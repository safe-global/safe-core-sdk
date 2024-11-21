export type PasskeyCredentialRequestOptions = {
  publicKey: PasskeyPublicKeyCredentialRequestOptions
}

export interface PasskeyPublicKeyCredentialRequestOptions {
  challenge: Uint8Array
  rpId?: string
  allowCredentials: {
    type: 'public-key'
    id: Uint8Array
  }[]
  userVerification?: Exclude<PasskeyUserVerificationRequirement, 'discouraged'>
  attestation?: 'none'
}

export type PasskeyUserVerificationRequirement = 'required' | 'preferred' | 'discouraged'

export type PasskeyCredential<T> = {
  id: string
  type: 'public-key'
  rawId: ArrayBuffer
  response: T
}

export type PasskeyAuthenticatorAttestationResponse = {
  clientDataJSON: ArrayBuffer
  attestationObject: ArrayBuffer
  getPublicKey(): ArrayBuffer | string
}

export interface PasskeyAuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer
  authenticatorData: ArrayBuffer
  signature: ArrayBuffer
  userHandle: ArrayBuffer
}

export type PasskeyCoordinates = {
  x: string
  y: string
}

export type GetPasskeyCredentialFn = (
  options?: PasskeyCredentialRequestOptions
) => Promise<PasskeyCredential<PasskeyAuthenticatorAssertionResponse>>

export type PasskeyArgType = {
  rawId: string // required to sign data
  coordinates: PasskeyCoordinates // required to sign data
  customVerifierAddress?: string
  getFn?: GetPasskeyCredentialFn
}
