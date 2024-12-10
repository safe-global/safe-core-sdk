export type PasskeyCoordinates = {
  x: string
  y: string
}

export type GetPasskeyCredentialFn = (options?: CredentialRequestOptions) => Promise<Credential>

export type PasskeyArgType = {
  rawId: string // required to sign data
  coordinates: PasskeyCoordinates // required to sign data
  customVerifierAddress?: string
  getFn?: GetPasskeyCredentialFn
}
