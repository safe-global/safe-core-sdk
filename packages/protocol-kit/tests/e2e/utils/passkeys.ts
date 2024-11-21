import { PasskeyArgType, PasskeyClient } from '@safe-global/protocol-kit'
import { WebAuthnCredentials } from './webauthnShim'
import { WalletClient, keccak256, toBytes, Transport, Chain, Account } from 'viem'
import { asHex } from '@safe-global/protocol-kit/utils/types'
import { decodePublicKeyForWeb } from '@safe-global/protocol-kit/utils'

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
 * Deploys the passkey contract for each of the signers.
 * @param passkeys An array of PasskeyClient representing the passkeys to deploy.
 * @param signer A signer to deploy the passkey contracts.
 * @returns Passkey deployment transactions
 */
export async function deployPasskeysContract(
  passkeys: PasskeyClient[],
  signer: WalletClient<Transport, Chain, Account>
) {
  const toDeploy = passkeys.map(async (client) => {
    const { data, to, value } = client.createDeployTxRequest()
    const createPasskeySignerTransaction = {
      to,
      value: BigInt(value),
      data: asHex(data)
    }
    // Deploy the passkey signer
    return await signer.sendTransaction(createPasskeySignerTransaction)
  })

  return Promise.all(toDeploy)
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
        id: toBytes(keccak256(toBytes(name))),
        name: name,
        displayName: name
      },
      challenge: toBytes(Date.now()),
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

  const rawId = Buffer.from(passkeyCredential.rawId).toString('hex')

  const coordinates = await decodePublicKeyForWeb(exportedPublicKey)

  const passkey: PasskeyArgType = {
    rawId,
    coordinates
  }

  return passkey
}
