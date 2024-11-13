import { getFCLP256VerifierDeployment } from '@safe-global/safe-modules-deployments'
import { Buffer } from 'buffer'
import { PasskeyCoordinates, PasskeyArgType } from '@safe-global/protocol-kit/types'

/**
 * Extracts and returns the passkey data (coordinates and rawId) from a given passkey Credential.
 *
 * @param {Credential} passkeyCredential - The passkey credential generated via `navigator.credentials.create()` using correct parameters.
 * @returns {Promise<PasskeyArgType>} A promise that resolves to an object containing the coordinates and the rawId derived from the passkey.
 * @throws {Error} Throws an error if the coordinates could not be extracted
 */
export async function extractPasskeyData(passkeyCredential: Credential): Promise<PasskeyArgType> {
  const passkey = passkeyCredential as PublicKeyCredential
  const attestationResponse = passkey.response as AuthenticatorAttestationResponse

  const publicKey = attestationResponse.getPublicKey()

  if (!publicKey) {
    throw new Error('Failed to generate passkey Coordinates. getPublicKey() failed')
  }

  const coordinates = await extractPasskeyCoordinates(publicKey)
  const rawId = Buffer.from(passkey.rawId).toString('hex')

  return {
    rawId,
    coordinates
  }
}

/**
 * Extracts and returns coordinates from a given passkey public key.
 *
 * @param {ArrayBuffer} publicKey - The public key of the passkey from which coordinates will be extracted.
 * @returns {Promise<PasskeyCoordinates>} A promise that resolves to an object containing the coordinates derived from the public key of the passkey.
 * @throws {Error} Throws an error if the coordinates could not be extracted via `crypto.subtle.exportKey()`
 */
export async function extractPasskeyCoordinates(
  publicKey: ArrayBuffer
): Promise<PasskeyCoordinates> {
  const algorithm = {
    name: 'ECDSA',
    namedCurve: 'P-256',
    hash: { name: 'SHA-256' }
  }

  const key = await crypto.subtle.importKey('spki', publicKey, algorithm, true, ['verify'])

  const { x, y } = await crypto.subtle.exportKey('jwk', key)

  const isValidCoordinates = !!x && !!y

  if (!isValidCoordinates) {
    throw new Error('Failed to generate passkey Coordinates. crypto.subtle.exportKey() failed')
  }

  return {
    x: '0x' + Buffer.from(x, 'base64').toString('hex'),
    y: '0x' + Buffer.from(y, 'base64').toString('hex')
  }
}

export function getDefaultFCLP256VerifierAddress(chainId: string): string {
  const FCLP256VerifierDeployment = getFCLP256VerifierDeployment({
    version: '0.2.1',
    released: true,
    network: chainId
  })

  if (!FCLP256VerifierDeployment) {
    throw new Error(`Failed to load FCLP256Verifier deployment for chain ID ${chainId}`)
  }

  const verifierAddress = FCLP256VerifierDeployment.networkAddresses[chainId]

  if (!verifierAddress) {
    throw new Error(`FCLP256Verifier address not found for chain ID ${chainId}`)
  }

  return verifierAddress
}
