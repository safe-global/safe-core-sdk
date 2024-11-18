import { p256 } from '@noble/curves/p256'
import { Buffer } from 'buffer'
import { getFCLP256VerifierDeployment } from '@safe-global/safe-modules-deployments'
import { PasskeyArgType, PasskeyCoordinates } from '@safe-global/protocol-kit/types'

/**
 * Extracts and returns the passkey data (coordinates and rawId) from a given passkey Credential.
 *
 * @param {Credential} passkeyCredential - The passkey credential generated via `navigator.credentials.create()` or other method in another platforms.
 * @returns {Promise<PasskeyArgType>} A promise that resolves to an object containing the coordinates and the rawId derived from the passkey.
 * This is the important information in the Safe account context and should be stored securely as it is used to verify the passkey and to instantiate the SDK
 * as a signer (`Safe.init())
 * @throws {Error} Throws an error if the coordinates could not be extracted
 */
export async function extractPasskeyData(passkeyCredential: Credential): Promise<PasskeyArgType> {
  const passkey = passkeyCredential as PublicKeyCredential
  const attestationResponse = passkey.response as AuthenticatorAttestationResponse

  const rawId = Buffer.from(passkey.rawId).toString('hex')
  const coordinates = await decodePublicKey(attestationResponse)

  return {
    rawId,
    coordinates
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const base64Fixed = base64.replace(/-/g, '+').replace(/_/g, '/')
  const binaryString = atob(base64Fixed)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function ensureCorrectFormat(publicKey: Uint8Array): Uint8Array {
  if (publicKey.length === 64) {
    const uncompressedKey = new Uint8Array(65)
    uncompressedKey[0] = 0x04
    uncompressedKey.set(publicKey, 1)
    return uncompressedKey
  }
  return publicKey
}

function decodePublicKeyForReactNative(publicKey: string): PasskeyCoordinates {
  const publicKeyUint8Array = base64ToUint8Array(publicKey)

  if (publicKeyUint8Array.length === 0) {
    throw new Error('Decoded public key is empty.')
  }

  const formattedKey = ensureCorrectFormat(publicKeyUint8Array)
  const point = p256.ProjectivePoint.fromHex(formattedKey)

  const x = point.x.toString(16).padStart(64, '0')
  const y = point.y.toString(16).padStart(64, '0')

  return {
    x: '0x' + x,
    y: '0x' + y
  }
}

async function decodePublicKeyForWeb(publicKey: ArrayBuffer): Promise<PasskeyCoordinates> {
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

/**
 * Decodes the x and y coordinates of the public key from a created public key credential response.
 *
 * @param {Pick<AuthenticatorAttestationResponse, 'attestationObject'>} response
 * @returns {PasskeyCoordinates} Object containing the coordinates derived from the public key of the passkey.
 * @throws {Error} Throws an error if the coordinates could not be extracted via `p256.ProjectivePoint.fromHex`
 */
export async function decodePublicKey(
  response: AuthenticatorAttestationResponse
): Promise<PasskeyCoordinates> {
  const publicKey = response.getPublicKey()

  if (!publicKey) {
    throw new Error('Failed to generate passkey coordinates. getPublicKey() failed')
  }

  try {
    if (typeof publicKey === 'string') {
      // Public key is base64 encoded
      // React Native platform uses base64 encoded strings
      return decodePublicKeyForReactNative(publicKey)
    } else if (publicKey instanceof ArrayBuffer) {
      // Public key is an ArrayBuffer
      // Web platform uses ArrayBuffer
      return await decodePublicKeyForWeb(publicKey)
    } else {
      throw new Error('Unsupported public key format.')
    }
  } catch (error) {
    console.error('Error decoding public key:', error)
    throw error
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
