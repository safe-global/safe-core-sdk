import { WebAuthnCredentials } from './webauthnShim'
import { ethers } from 'ethers'
import { PasskeyArgType, extractPasskeyData } from '@safe-global/protocol-kit'

let singleInstance: WebAuthnCredentials

// This needs to be a singleton. The reason for that is that we are adding it to a global reference in the tests.
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

  const passkey = await extractPasskeyData(passkeyCredential)

  return passkey
}
