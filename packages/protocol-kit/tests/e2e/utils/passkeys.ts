import { WebAuthnCredentials } from './webauthnShim'
import { ethers } from 'ethers'
import { PasskeyArgType } from '@safe-global/protocol-kit'

let singleInstance: WebAuthnCredentials

// This needs to be a singleton
export function getWebAuthnCredentials() {
  if (!singleInstance) {
    singleInstance = new WebAuthnCredentials()
  }

  return singleInstance
}

/**
 * Creates a mock passkey for testing purposes.
 * @param name User name used for passkey mock
 * @returns Passkey arguments
 */
export async function createMockPasskey(name: string): Promise<PasskeyArgType> {
  const passkeyCredential = await getWebAuthnCredentials().create({
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
