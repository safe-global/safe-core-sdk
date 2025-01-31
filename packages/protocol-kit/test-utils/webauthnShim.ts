/**
 * This module provides a minimal shim to emulate the Web Authentication API implemented in browsers. This allows us to
 * write tests where we create and authenticate WebAuthn credentials that are verified on-chain.
 *
 * This implementation is inspired by software authenticators found in the Awesome WebAuthn list [1].
 *
 * [1]: <https://github.com/herrjemand/awesome-webauthn#software-authenticators>
 */

import { p256 } from '@noble/curves/p256'
import { ethers } from 'ethers'
import type { BytesLike } from 'ethers'
import CBOR from 'cbor'

/**
 * Encode bytes using the Base64 URL encoding.
 *
 * See <https://www.rfc-editor.org/rfc/rfc4648#section-5>
 *
 * @param data data to encode to `base64url`
 * @returns the `base64url` encoded data as a string.
 */
export function base64UrlEncode(data: string | Uint8Array | ArrayBuffer): string {
  const buffer =
    typeof data === 'string' ? Buffer.from(data.replace(/^0x/, ''), 'hex') : Buffer.from(data)
  return buffer.toString('base64url')
}

/**
 * Returns the flag for the user verification requirement.
 *
 * See: <https://w3c.github.io/webauthn/#enumdef-userverificationrequirement>
 *
 * @param userVerification - The user verification requirement.
 * @returns The flag for the user verification requirement.
 */
export function userVerificationFlag(
  userVerification: UserVerificationRequirement = 'preferred'
): number {
  switch (userVerification) {
    case 'preferred':
      return 0x01
    case 'required':
      return 0x04
    default:
      throw new Error(`user verification requirement ${userVerification} not supported`)
  }
}

function b2ab(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

/**
 * Compare the equality of two Uint8Arrays.
 * @param a First array.
 * @param b Second array.
 * @returns Whether the two arrays are equal.
 */
function isEqualArray(a: Uint8Array, b: Uint8Array) {
  if (a.length != b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] != b[i]) return false
  return true
}

/**
 * Returns the message that gets signed by the WebAuthn credentials.
 *
 * See <https://w3c.github.io/webauthn/#fig-signature>
 */
export function encodeWebAuthnSigningMessage(
  clientData: { type: 'webauthn.get'; challenge: string; [key: string]: unknown },
  authenticatorData: BytesLike
) {
  return ethers.getBytes(
    ethers.concat([
      authenticatorData,
      ethers.sha256(ethers.toUtf8Bytes(JSON.stringify(clientData)))
    ])
  )
}

export interface CredentialCreationOptions {
  publicKey: PublicKeyCredentialCreationOptions
}

export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged'

/**
 * Public key credetial creation options, restricted to a subset of options that this module supports.
 * See <https://w3c.github.io/webauthn/#dictionary-makecredentialoptions>.
 */
export interface PublicKeyCredentialCreationOptions {
  rp: { id: string; name: string }
  user: { id: Uint8Array; displayName: string; name: string }
  challenge: Uint8Array
  pubKeyCredParams: {
    type: 'public-key'
    alg: number
  }[]
  attestation?: 'none'
  userVerification?: Exclude<UserVerificationRequirement, 'discouraged'>
}

export interface CredentialRequestOptions {
  publicKey: PublicKeyCredentialRequestOptions
}

/**
 * Public key credetial request options, restricted to a subset of options that this module supports.
 * See <https://w3c.github.io/webauthn/#dictionary-assertion-options>.
 */
export interface PublicKeyCredentialRequestOptions {
  challenge: Uint8Array
  rpId: string
  allowCredentials: {
    type: 'public-key'
    id: Uint8Array
  }[]
  userVerification?: Exclude<UserVerificationRequirement, 'discouraged'>
  attestation?: 'none'
}

/**
 * A created public key credential. See <https://w3c.github.io/webauthn/#iface-pkcredential>.
 */
export interface PublicKeyCredential<AuthenticatorResponse> {
  type: 'public-key'
  id: string
  rawId: ArrayBuffer
  response: AuthenticatorResponse
}

/**
 * The authenticator's response to a client’s request for the creation of a new public key credential.
 * See <https://w3c.github.io/webauthn/#iface-authenticatorattestationresponse>.
 */
export interface AuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer
  attestationObject: ArrayBuffer
  getPublicKey: () => ArrayBuffer
}

/**
 * The authenticator's response to a client’s request generation of a new authentication assertion given the WebAuthn Relying Party's challenge.
 * See <https://w3c.github.io/webauthn/#iface-authenticatorassertionresponse>.
 */
export interface AuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer
  authenticatorData: ArrayBuffer
  signature: ArrayBuffer
  userHandle: ArrayBuffer
}

class Credential {
  public id: string
  public rawId: Uint8Array
  public pk: bigint

  constructor(
    public rp: string,
    public user: Uint8Array,
    pk?: bigint
  ) {
    this.pk = pk || p256.utils.normPrivateKeyToScalar(p256.utils.randomPrivateKey())
    this.id = ethers.dataSlice(
      ethers.keccak256(ethers.dataSlice(p256.getPublicKey(this.pk, false), 1)),
      12
    )
    this.rawId = ethers.getBytes(this.id)
  }

  /**
   * Computes the COSE encoded public key for this credential.
   * See <https://datatracker.ietf.org/doc/html/rfc8152>.
   *
   * @returns Hex-encoded COSE-encoded public key
   */
  public cosePublicKey(): string {
    const pubk = p256.getPublicKey(this.pk, false)
    const x = pubk.subarray(1, 33)
    const y = pubk.subarray(33, 65)

    // <https://webauthn.guide/#registration>
    const key = new Map()
    // <https://datatracker.ietf.org/doc/html/rfc8152#section-13.1.1>
    key.set(-1, 1) // crv = P-256
    key.set(-2, b2ab(x))
    key.set(-3, b2ab(y))
    // <https://datatracker.ietf.org/doc/html/rfc8152#section-7>
    key.set(1, 2) // kty = EC2
    key.set(3, -7) // alg = ES256 (Elliptic curve signature with SHA-256)

    return ethers.hexlify(CBOR.encode(key))
  }
}

export class WebAuthnCredentials {
  credentials: Credential[] = []

  /**
   * Creates a new instance of the WebAuthn credentials.
   * @param privateKey The private key to use for the credentials. If not provided, a random key will be generated.
   */
  constructor(private privateKey?: bigint) {}

  /**
   * This is a shim for `navigator.credentials.create` method.
   * See <https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-create>.
   *
   * @param options The public key credential creation options.
   * @returns A public key credential with an attestation response.
   */
  public create({
    publicKey
  }: CredentialCreationOptions): PublicKeyCredential<AuthenticatorAttestationResponse> {
    if (!publicKey.pubKeyCredParams.some(({ alg }) => alg === -7)) {
      throw new Error('unsupported signature algorithm(s)')
    }

    const credential = new Credential(publicKey.rp.id, publicKey.user.id, this.privateKey)
    this.credentials.push(credential)

    // <https://w3c.github.io/webauthn/#dictionary-client-data>
    const clientData = {
      type: 'webauthn.create',
      challenge: base64UrlEncode(publicKey.challenge),
      origin: `https://${publicKey.rp.id}`
    }

    // <https://w3c.github.io/webauthn/#sctn-attestation>
    const attestationObject = {
      authData: b2ab(
        ethers.getBytes(
          ethers.solidityPacked(
            ['bytes32', 'uint8', 'uint32', 'bytes16', 'uint16', 'bytes', 'bytes'],
            [
              ethers.sha256(ethers.toUtf8Bytes(publicKey.rp.id)),
              0x40 + userVerificationFlag(publicKey.userVerification), // flags = attested_data + user_present
              0, // signCount
              `0x${'42'.repeat(16)}`, // aaguid
              ethers.dataLength(credential.id),
              credential.id,
              credential.cosePublicKey()
            ]
          )
        )
      ),
      fmt: 'none',
      attStmt: {}
    }

    return {
      id: base64UrlEncode(credential.rawId),
      rawId: credential.rawId.slice(),
      response: {
        clientDataJSON: b2ab(ethers.toUtf8Bytes(JSON.stringify(clientData))),
        attestationObject: b2ab(CBOR.encode(attestationObject)),
        getPublicKey: () => b2ab(p256.getPublicKey(credential.pk, false))
      },
      type: 'public-key'
    }
  }

  /**
   * This is a shim for `navigator.credentials.get` method.
   * See <https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-get>.
   *
   * @param options The public key credential request options.
   * @returns A public key credential with an assertion response.
   */
  get({
    publicKey
  }: CredentialRequestOptions): PublicKeyCredential<AuthenticatorAssertionResponse> {
    const credential = publicKey.allowCredentials
      .flatMap(({ id }) => this.credentials.filter((c) => isEqualArray(c.rawId, id)))
      .at(0)
    if (credential === undefined) {
      throw new Error('credential not found')
    }

    // <https://w3c.github.io/webauthn/#dictionary-client-data>
    const clientData = {
      type: 'webauthn.get' as const,
      challenge: base64UrlEncode(publicKey.challenge),
      origin: `https://${credential.rp}`
    }

    // <https://w3c.github.io/webauthn/#sctn-authenticator-data>
    // Note that we use a constant 0 value for signCount to simplify things:
    // > If the authenticator does not implement a signature counter, let the signature counter
    // > value remain constant at zero.
    const authenticatorData = ethers.solidityPacked(
      ['bytes32', 'uint8', 'uint32'],
      [
        ethers.sha256(ethers.toUtf8Bytes(credential.rp)),
        userVerificationFlag(publicKey.userVerification), // flags = user_present
        0 // signCount
      ]
    )

    // <https://w3c.github.io/webauthn/#sctn-op-get-assertion>
    const message = encodeWebAuthnSigningMessage(clientData, authenticatorData)
    const signature = p256.sign(message, credential.pk, {
      lowS: false,
      prehash: true
    })

    return {
      id: base64UrlEncode(credential.rawId),
      rawId: credential.rawId.slice(),
      response: {
        clientDataJSON: b2ab(ethers.toUtf8Bytes(JSON.stringify(clientData))),
        authenticatorData: b2ab(ethers.getBytes(authenticatorData)),
        signature: b2ab(signature.toDERRawBytes(false)),
        userHandle: credential.user
      },
      type: 'public-key'
    }
  }
}
