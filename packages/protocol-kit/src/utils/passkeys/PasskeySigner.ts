import { ethers, AbstractSigner, Provider } from 'ethers'

import { PasskeyCoordinates, PasskeyArgType } from '../../types/passkeys'
import { SafeWebAuthnSignerFactoryContractImplementationType } from '../../types/contracts'
import { EMPTY_DATA } from '../constants'
import { getDefaultFCLP256VerifierAddress, hexStringToUint8Array } from './extractPasskeyData'

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

  /**
   * P256 Verifier Contract address.
   */
  verifierAddress: string

  /**
   * chainId
   */
  chainId: string

  constructor(
    passkey: PasskeyArgType,
    safeWebAuthnSignerFactoryContract: SafeWebAuthnSignerFactoryContractImplementationType,
    provider: Provider,
    chainId: string
  ) {
    super(provider)

    const { rawId, coordinates, customVerifierAddress } = passkey

    this.passkeyRawId = hexStringToUint8Array(rawId)
    this.coordinates = coordinates
    this.safeWebAuthnSignerFactoryContract = safeWebAuthnSignerFactoryContract
    this.chainId = chainId
    this.verifierAddress = customVerifierAddress || getDefaultFCLP256VerifierAddress(chainId)
  }

  /**
   * Returns the address associated with the passkey signer.
   * @returns {Promise<string>} A promise that resolves to the signer's address.
   */
  async getAddress(): Promise<string> {
    const [signerAddress] = await this.safeWebAuthnSignerFactoryContract.getSigner([
      BigInt(this.coordinates.x),
      BigInt(this.coordinates.y),
      BigInt(this.verifierAddress)
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
      BigInt(this.verifierAddress)
    ])
  }

  /**
   * Creates the deployment transaction to create a passkey signer.
   * @returns {string} The deployment transaction to create a passkey signer.
   */
  async createPasskeyDeploymentTransaction() {
    const passkeyAddress = await this.getAddress()
    const isPasskeyDeployed = (await this.provider?.getCode(passkeyAddress)) !== EMPTY_DATA

    if (isPasskeyDeployed) {
      throw new Error('Passkey Signer contract already deployed')
    }

    const passkeySignerDeploymentTransaction = {
      to: await this.safeWebAuthnSignerFactoryContract.getAddress(),
      value: '0',
      data: this.encodeCreateSigner()
    }

    return passkeySignerDeploymentTransaction
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

    if (!assertion?.response?.authenticatorData) {
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
    const passkey: PasskeyArgType = {
      rawId: Buffer.from(this.passkeyRawId).toString('hex'),
      coordinates: this.coordinates,
      customVerifierAddress: this.verifierAddress
    }

    return new PasskeySigner(
      passkey,
      this.safeWebAuthnSignerFactoryContract,
      provider,
      this.chainId
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
 * Compute the additional client data JSON fields. This is the fields other than `type` and
 * `challenge` (including `origin` and any other additional client data fields that may be
 * added by the authenticator).
 *
 * See <https://w3c.github.io/webauthn/#clientdatajson-serialization>
 *
 * @param {ArrayBuffer} clientDataJSON - The client data JSON.
 * @returns {string} A hex string of the additional fields from the client data JSON.
 * @throws {Error} Throws an error if the client data JSON does not contain the expected 'origin' field.
 */
function extractClientDataFields(clientDataJSON: ArrayBuffer): string {
  const { origin, crossOrigin } = JSON.parse(new TextDecoder('utf-8').decode(clientDataJSON))

  if (!origin) {
    throw new Error('origin not found in client data JSON')
  }

  const additionalFields = `"origin":"${origin}"`

  if (crossOrigin !== undefined) {
    additionalFields.concat(`,"crossOrigin":${crossOrigin}`)
  }

  return ethers.hexlify(ethers.toUtf8Bytes(additionalFields))
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
