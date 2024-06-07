import { PasskeyArgType } from '@safe-global/protocol-kit'
import crypto from 'crypto'
import { ethers } from 'ethers'
import { WebAuthnCredentials } from './webauthnShim'

/**
 * Creates a mock passkey for testing purposes.
 * @param name User name used for passkey mock
 * @param pk Private key to use for passkey mock. If not provided, a random key will be generated.
 * @returns Object containing Passkey arguments and WebAuthnCredentials instance for testing
 */
export async function createMockPasskey(
  name: string,
  webAuthnCredentials: WebAuthnCredentials
): Promise<PasskeyArgType> {
  const passkeyCredential = await webAuthnCredentials.create({
    publicKey: {
      rp: {
        name: 'Safe',
        id: 'safe.global'
      },
      user: {
        id: ethers.getBytes(ethers.id(name)),
        name: name,
        displayName: name
      },
      challenge: ethers.toBeArray(Date.now()),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
    }
  })

  const algorithm = {
    name: 'ECDSA',
    namedCurve: 'P-256',
    hash: { name: 'SHA-256' }
  }
  const key = await crypto.subtle.importKey(
    'raw',
    passkeyCredential.response.getPublicKey(),
    algorithm,
    true,
    ['verify']
  )
  const exportedPublicKey = await crypto.subtle.exportKey('spki', key)

  return { rawId: passkeyCredential.rawId, publicKey: exportedPublicKey }
}
