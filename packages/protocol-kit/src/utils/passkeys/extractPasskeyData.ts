import { p256 } from '@noble/curves/p256'
import { AsnProp, AsnPropTypes, AsnType, AsnTypeTypes, AsnParser } from '@peculiar/asn1-schema'
import { Buffer } from 'buffer'
import { getFCLP256VerifierDeployment } from '@safe-global/safe-modules-deployments'
import { PasskeyArgType, PasskeyCoordinates } from '@safe-global/protocol-kit/types'

@AsnType({ type: AsnTypeTypes.Sequence })
class AlgorithmIdentifier {
  @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
  public id: string = ''

  @AsnProp({ type: AsnPropTypes.ObjectIdentifier, optional: true })
  public curve: string = ''
}

@AsnType({ type: AsnTypeTypes.Sequence })
class ECPublicKey {
  @AsnProp({ type: AlgorithmIdentifier })
  public algorithm = new AlgorithmIdentifier()

  @AsnProp({ type: AsnPropTypes.BitString })
  public publicKey: ArrayBuffer = new ArrayBuffer(0)
}

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

  const coordinates = decodePublicKey(attestationResponse)
  const rawId = Buffer.from(passkey.rawId).toString('hex')

  return {
    rawId,
    coordinates
  }
}

function isBase64String(str: string): boolean {
  const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*?(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
  return base64Regex.test(str)
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binaryString, (c) => c.charCodeAt(0))
}

/**
 * Decodes the x and y coordinates of the public key from a created public key credential response.
 * Inspired from <https://webauthn.guide/#registration>.
 *
 * @param {Pick<AuthenticatorAttestationResponse, 'attestationObject'>} response
 * @returns {PasskeyCoordinates} Object containing the coordinates derived from the public key of the passkey.
 * @throws {Error} Throws an error if the coordinates could not be extracted via `p256.ProjectivePoint.fromHex`
 */
export function decodePublicKey(response: AuthenticatorAttestationResponse): PasskeyCoordinates {
  const publicKey = response.getPublicKey()

  if (!publicKey) {
    throw new Error('Failed to generate passkey coordinates. getPublicKey() failed')
  }

  console.log('Public Key:', publicKey)

  try {
    let publicKeyUint8Array: Uint8Array

    if (typeof publicKey === 'string') {
      console.log('Public Key is Base64')
      publicKeyUint8Array = decodeBase64(publicKey)
    } else if (publicKey instanceof ArrayBuffer) {
      console.log('Public Key is ArrayBuffer')
      publicKeyUint8Array = new Uint8Array(publicKey)
    } else {
      throw new Error('Unsupported public key format.')
    }

    console.log('Decoded Public Key Uint8Array:', publicKeyUint8Array)

    if (publicKeyUint8Array.length === 0) {
      throw new Error('Decoded public key is empty.')
    }

    // Parse the DER-encoded public key using the ASN.1 schema
    const decodedKey = AsnParser.parse(publicKeyUint8Array.buffer, ECPublicKey)

    // Extract the actual public key bytes
    const keyData = new Uint8Array(decodedKey.publicKey)

    // Parse the public key bytes into a point on the curve
    const point = p256.ProjectivePoint.fromHex(keyData)

    console.log('Elliptic Curve Point:', point)

    // Extract x and y coordinates
    const x = point.x.toString(16).padStart(64, '0')
    const y = point.y.toString(16).padStart(64, '0')

    return {
      x: '0x' + x,
      y: '0x' + y
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
