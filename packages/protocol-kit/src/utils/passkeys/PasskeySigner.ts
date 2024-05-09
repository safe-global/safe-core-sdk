import { ethers, AbstractSigner, Provider } from 'ethers'
import { Buffer } from 'buffer'
import { PasskeyCoordinates, passkeyArgType } from '../../types/passkeys'
import { SafeWebAuthnSignerFactoryContractImplementationType } from '../../types/contracts'

// Sepolia only
const P256_VERIFIER_ADDRESS = '0xcA89CBa4813D5B40AeC6E57A30d0Eeb500d6531b' // FCLP256Verifier

/**
 * Represents a Signer that is created using a passkey.
 * This class extends the AbstractSigner to implement signer functionalities.
 *
 * @extends {AbstractSigner}
 */
class PasskeySigner extends AbstractSigner {
  /**
   * The raw identifier of the passkey.
   * see: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/rawId
   */
  passkeyRawId: ArrayBuffer

  /**
   * Passkey Coordinates.
   */
  coordinates: PasskeyCoordinates

  /**
   * Safe WebAuthn signer factory Contract.
   */
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

  /**
   * Returns the address associated with the Signer.
   * @returns {Promise<string>} A promise that resolves to the signer's address.
   */
  async getAddress(): Promise<string> {
    const [signerAddress] = await this.safeWebAuthnSignerFactoryContract.getSigner([
      BigInt(this.coordinates.x),
      BigInt(this.coordinates.y),
      BigInt(P256_VERIFIER_ADDRESS)
    ])

    return signerAddress
  }

  /**
   * Encodes the createSigner contract function.
   * @returns {string} The encoded data to create a signer.
   */
  encodeCreateSigner(): string {
    return this.safeWebAuthnSignerFactoryContract.encode('createSigner', [
      BigInt(this.coordinates.x),
      BigInt(this.coordinates.y),
      BigInt(P256_VERIFIER_ADDRESS)
    ])
  }

  /**
   * Signs the provided data using the passkey.
   * @param {Uint8Array} data - The data to be signed.
   * @returns {Promise<string>} A promise that resolves to the signed data.
   */
  async sign(data: Uint8Array): Promise<string> {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: data,
        allowCredentials: [{ type: 'public-key', id: this.passkeyRawId }],
        userVerification: 'required'
      }
    })) as PublicKeyCredential & { response: AuthenticatorAssertionResponse }

    if (!assertion || !assertion?.response?.authenticatorData) {
      throw new Error('Failed to sign data with passkey Signer')
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

  connect(provider: Provider): ethers.Signer {
    return new PasskeySigner(
      this.passkeyRawId,
      this.coordinates,
      this.safeWebAuthnSignerFactoryContract,
      provider
    )
  }

  signTransaction(): Promise<string> {
    throw new Error('Passkey Signers cannot sign transactions, they can only sign data.')
  }

  signMessage(message: string | Uint8Array): Promise<string> {
    if (typeof message === 'string') {
      return this.sign(ethers.getBytes(message))
    }

    return this.sign(message)
  }

  signTypedData(): Promise<string> {
    throw new Error('Passkey Signers cannot sign signTypedData, they can only sign data.')
  }
}

export default PasskeySigner

/**
 * Extracts and returns coordinates from a given passkey public key.
 *
 * @param {ArrayBuffer} publicKey - The public key of the passkey from which coordinates will be extracted.
 * @returns {Promise<PasskeyCoordinates>} A promise that resolves to an object containing the coordinates derived from the public key of the passkey.
 * @throws {Error} Throws an error if the coordinates could not be extracted via `crypto.subtle.exportKey()`
 */
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
 *
 * @param {ArrayBuffer} clientDataJSON - The client data JSON.
 * @returns {string} A hex string of the additional fields from the client data JSON.
 * @throws {Error} Throws an error if the client data JSON does not contain the expected 'challenge' field pattern.
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

/**
 * Extracts the numeric values r and s from a DER-encoded ECDSA signature.
 * This function decodes the signature based on a specific format and validates the encoding at each step.
 *
 * @param {ArrayBuffer} signature - The DER-encoded signature to be decoded.
 * @returns {[bigint, bigint]} A tuple containing two BigInt values, r and s, which are the numeric values extracted from the signature.
 * @throws {Error} Throws an error if the signature encoding is invalid or does not meet expected conditions.
 */
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
