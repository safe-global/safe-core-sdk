export type PasskeyCoordinates = {
  x: string
  y: string
}

export type GetPasskeyCredentialFn = (options?: CredentialRequestOptions) => Promise<Credential>

/**
 * The data extracted from a WebAuthn public key credential.
 * This is the minimal output of `extractPasskeyData()` — purely what can be derived
 * from the credential itself, with no chain-specific or runtime state.
 */
export type ExtractedPasskeyData = {
  rawId: string
  coordinates: PasskeyCoordinates
}

/**
 * Full passkey configuration required to use a passkey as a Safe signer.
 * Extends `ExtractedPasskeyData` with chain-specific and runtime properties.
 */
export type PasskeyArgType = ExtractedPasskeyData & {
  verifierAddress: string
  getFn?: GetPasskeyCredentialFn
}
