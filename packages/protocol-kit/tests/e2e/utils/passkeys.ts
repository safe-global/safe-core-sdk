import { WebAuthnCredentials } from './webauthnShim'
import { ethers } from 'ethers'
import { PasskeyArgType } from '@safe-global/protocol-kit'

let singleInstance: WebAuthnCredentials

/**
 * This needs to be a singleton by default. The reason for that is that we are adding it to a global reference in the tests.
 * Should only be used if running the tests with a randomly generated private key.
 * For testing with a static private key, create a new WebAuthnCredentials instance instead and pass the private key as argument to the constructor.
 * @returns WebAuthnCredentials singleton instance
 */
export function getWebAuthnCredentials() {
  if (!singleInstance) {
    singleInstance = new WebAuthnCredentials()
  }

  return singleInstance
}

/**
 * Creates a mock passkey for testing purposes.
 * @param name User name used for passkey mock
 * @param webAuthnCredentials The credentials instance to use instead of the singleton. This is useful when mocking the passkey with a static private key.
 * @returns Passkey arguments
 */
export async function createMockPasskey(
  name: string,
  webAuthnCredentials?: WebAuthnCredentials
): Promise<PasskeyArgType> {
  const credentialsInstance = webAuthnCredentials ?? getWebAuthnCredentials()
  const passkeyCredential = credentialsInstance.create({
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
