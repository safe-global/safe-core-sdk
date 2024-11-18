import { p256 } from '@noble/curves/p256'
import { getFCLP256VerifierDeployment } from '@safe-global/safe-modules-deployments'
import { PasskeyArgType, PasskeyCoordinates } from '@safe-global/protocol-kit/types'

/**
 * Converts a Base64 URL-encoded string to a Uint8Array.
 *
 * This function handles Base64 URL variants by replacing URL-safe characters
 * with standard Base64 characters, decodes the Base64 string into a binary string,
 * and then converts it into a Uint8Array.
 *
 * @param {string} base64 - The Base64 URL-encoded string to convert.
 * @returns {Uint8Array} The resulting Uint8Array from the decoded Base64 string.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const base64Fixed = base64.replace(/-/g, '+').replace(/_/g, '/')
  const binaryBuffer = Buffer.from(base64Fixed, 'base64')

  return new Uint8Array(binaryBuffer)
}

/**
 * Ensures the elliptic curve public key is in the correct uncompressed format.
 *
 * Elliptic curve operations often require the public key to be in an uncompressed format,
 * which starts with a `0x04` byte, followed by the x and y coordinates. This function
 * checks the key length and prepends `0x04` if necessary.
 *
 * @param {Uint8Array} publicKey - The public key to format.
 * @returns {Uint8Array} The formatted public key in uncompressed format.
 */
function ensureCorrectFormat(publicKey: Uint8Array): Uint8Array {
  if (publicKey.length === 64) {
    const uncompressedKey = new Uint8Array(65)
    uncompressedKey[0] = 0x04
    uncompressedKey.set(publicKey, 1)

    return uncompressedKey
  }

  return publicKey
}

/**
 * Decodes a Base64-encoded ECDSA public key for React Native and extracts the x and y coordinates.
 *
 * This function decodes a Base64-encoded public key, ensures it is in the correct uncompressed format,
 * and extracts the x and y coordinates using the `@noble/curves` library. The coordinates are returned
 * as hexadecimal strings prefixed with '0x'.
 *
 * @param {string} publicKey - The Base64-encoded public key to decode.
 * @returns {PasskeyCoordinates} An object containing the x and y coordinates of the public key.
 * @throws {Error} Throws an error if the key coordinates cannot be extracted.
 */
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

/**
 * Decodes an ECDSA public key for the web platform and extracts the x and y coordinates.
 *
 * This function uses the Web Crypto API to import a public key in SPKI format and then
 * exports it to a JWK format to retrieve the x and y coordinates. The coordinates are
 * returned as hexadecimal strings prefixed with '0x'.
 *
 * @param {ArrayBuffer} publicKey - The public key in SPKI format to decode.
 * @returns {Promise<PasskeyCoordinates>} A promise that resolves to an object containing
 * the x and y coordinates of the public key.
 * @throws {Error} Throws an error if the key coordinates cannot be extracted.
 */
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
async function decodePublicKey(
  response: AuthenticatorAttestationResponse
): Promise<PasskeyCoordinates> {
  const publicKey = response.getPublicKey()

  if (!publicKey) {
    throw new Error('Failed to generate passkey coordinates. getPublicKey() failed')
  }

  if (typeof publicKey === 'string') {
    // Public key is base64 encoded
    // - React Native platform uses base64 encoded strings
    return decodePublicKeyForReactNative(publicKey)
  }

  if (publicKey instanceof ArrayBuffer) {
    // Public key is an ArrayBuffer
    // - Web platform uses ArrayBuffer
    return await decodePublicKeyForWeb(publicKey)
  }

  throw new Error('Unsupported public key format.')
}

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

/**
 * Retrieves the default FCLP256 Verifier address for a given blockchain network.
 *
 * This function fetches the deployment information for the FCLP256 Verifier and
 * returns the verifier address associated with the specified chain ID. It ensures
 * that the correct version and release status are used.
 *
 * @param {string} chainId - The ID of the blockchain network to retrieve the verifier address for.
 * @returns {string} The FCLP256 Verifier address for the specified chain ID.
 * @throws {Error} Throws an error if the deployment information or address cannot be found.
 */

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
