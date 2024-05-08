import { ethers, AbstractSigner, Provider } from 'ethers'
import { Buffer } from 'buffer'
import { PasskeyCoordinates, passkeyArgType } from '../../types/passkeys'
import { SafeWebAuthnSignerFactoryContractImplementationType } from '../../types/contracts'

// Sepolia only
const P256_VERIFIER_ADDRESS = '0xcA89CBa4813D5B40AeC6E57A30d0Eeb500d6531b' // FCLP256Verifier

// TODO: ADD JSDOC
class PasskeySigner extends AbstractSigner {
  passkeyRawId: ArrayBuffer
  coordinates: PasskeyCoordinates
  safeWebAuthnSignerFactoryContract: SafeWebAuthnSignerFactoryContractImplementationType

  constructor(
    passkeyRawId: ArrayBuffer,
    coordinates: PasskeyCoordinates,
    safeWebAuthnSignerFactoryContract: SafeWebAuthnSignerFactoryContractImplementationType,
    provider: Provider
  ) {
    super(provider)

    this.passkeyRawId = passkeyRawId
    this.coordinates = coordinates
    this.safeWebAuthnSignerFactoryContract = safeWebAuthnSignerFactoryContract
  }

  static async init(
    passkey: passkeyArgType,
    safeWebAuthnSignerFactoryContract: SafeWebAuthnSignerFactoryContractImplementationType,
    provider: Provider
  ): Promise<PasskeySigner> {
    const coordinates = await extractPasskeyCoordinates(passkey.publicKey)

    return new PasskeySigner(
      passkey.rawId,
      coordinates,
      safeWebAuthnSignerFactoryContract,
      provider
    )
  }

  async getAddress(): Promise<string> {
    const [signerAddress] = await this.safeWebAuthnSignerFactoryContract.getSigner([
      BigInt(this.coordinates.x),
      BigInt(this.coordinates.y),
      BigInt(P256_VERIFIER_ADDRESS)
    ])

    return signerAddress
  }

  // TODO: create createSignerTransaction() ???
  encondeCreateSigner(): string {
    return this.safeWebAuthnSignerFactoryContract.encode('createSigner', [
      BigInt(this.coordinates.x),
      BigInt(this.coordinates.y),
      BigInt(P256_VERIFIER_ADDRESS)
    ])
  }

  async sign(data: Uint8Array): Promise<string> {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: data,
        allowCredentials: [{ type: 'public-key', id: this.passkeyRawId }],
        userVerification: 'required'
      }
    })) as PublicKeyCredential & { response: AuthenticatorAssertionResponse }

    if (!assertion || !assertion?.response?.authenticatorData) {
      throw new Error('Failed to sign data with passkeys')
    }

    const { authenticatorData, signature, clientDataJSON } = assertion.response

    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'bytes', 'uint256[2]'],
      [
        new Uint8Array(authenticatorData),
        extractClientDataFields(clientDataJSON),
        extractSignature(signature)
      ]
    )
  }

  connect(): ethers.Signer {
    throw new Error('Method not implemented.')
  }

  signTransaction(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  signMessage(message: string | Uint8Array): Promise<string> {
    if (typeof message === 'string') {
      return this.sign(ethers.getBytes(message))
    }

    return this.sign(message)
  }

  signTypedData(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}

export default PasskeySigner

async function extractPasskeyCoordinates(publicKey: ArrayBuffer): Promise<PasskeyCoordinates> {
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
 * Compute the additional client data JSON fields. This is the fields other than `type` and
 * `challenge` (including `origin` and any other additional client data fields that may be
 * added by the authenticator).
 *
 * See <https://w3c.github.io/webauthn/#clientdatajson-serialization>
 */
function extractClientDataFields(clientDataJSON: ArrayBuffer): string {
  const decodedClientDataJSON = new TextDecoder('utf-8').decode(clientDataJSON)
  const match = decodedClientDataJSON.match(
    /^\{"type":"webauthn.get","challenge":"[A-Za-z0-9\-_]{43}",(.*)\}$/
  )

  if (!match) {
    throw new Error('challenge not found in client data JSON')
  }

  const [, fields] = match
  return ethers.hexlify(ethers.toUtf8Bytes(fields))
}

function extractSignature(signature: ArrayBuffer): [bigint, bigint] {
  const check = (x: boolean) => {
    if (!x) {
      throw new Error('invalid signature encoding')
    }
  }

  // Decode the DER signature. Note that we assume that all lengths fit into 8-bit integers,
  // which is true for the kinds of signatures we are decoding but generally false. I.e. this
  // code should not be used in any serious application.
  const view = new DataView(signature)

  // check that the sequence header is valid
  check(view.getUint8(0) === 0x30)
  check(view.getUint8(1) === view.byteLength - 2)

  // read r and s
  const readInt = (offset: number) => {
    check(view.getUint8(offset) === 0x02)
    const len = view.getUint8(offset + 1)
    const start = offset + 2
    const end = start + len
    const n = BigInt(ethers.hexlify(new Uint8Array(view.buffer.slice(start, end))))
    check(n < ethers.MaxUint256)
    return [n, end] as const
  }
  const [r, sOffset] = readInt(2)
  const [s] = readInt(sOffset)

  return [r, s]
}
