import { WebAuthnCredentials } from './webauthnShim'
import { ethers } from 'ethers'
import { PasskeyArgType } from '@safe-global/protocol-kit'
import { getAccounts } from './setupTestNetwork'
import PasskeySigner from '@safe-global/protocol-kit/utils/passkeys/PasskeySigner'

let singleInstance: WebAuthnCredentials

// This needs to be a singleton. The reason for that is that we are adding it to a global reference in the tests.
export function getWebAuthnCredentials() {
  if (!singleInstance) {
    singleInstance = new WebAuthnCredentials()
  }

  return singleInstance
}

/**
 * Deploys the passkey contract for each of the signers.
 * @param name User name used for passkey mock
 * @returns Passkey arguments
 */
export async function deployPasskeysContract(passkeys: PasskeySigner[]) {
  const [deployer] = await getAccounts()

  const toDeploy = passkeys.map(async (passkey) => {
    const createPasskeySignerTransaction = {
      to: await passkey.safeWebAuthnSignerFactoryContract.getAddress(),
      value: '0',
      data: passkey.encodeCreateSigner()
    }
    // Deploy the passkey signer
    return await deployer.signer.sendTransaction(createPasskeySignerTransaction)
  })

  return Promise.all(toDeploy)
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
