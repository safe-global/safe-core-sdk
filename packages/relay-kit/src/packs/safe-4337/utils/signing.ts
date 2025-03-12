import { Address, Hex, encodePacked, toHex } from 'viem'
import { EthSafeSignature, buildSignatureBytes } from '@safe-global/protocol-kit'

/**
 * Passkey Dummy client data JSON fields. This can be used for gas estimations, as it pads the fields enough
 * to account for variations in WebAuthn implementations.
 */
export const DUMMY_CLIENT_DATA_FIELDS = [
  `"origin":"https://safe.global"`,
  `"padding":"This pads the clientDataJSON so that we can leave room for additional implementation specific fields for a more accurate 'preVerificationGas' estimate."`
].join(',')

/**
 * Dummy authenticator data. This can be used for gas estimations, as it ensures that the correct
 * authenticator flags are set.
 */
export const DUMMY_AUTHENTICATOR_DATA = new Uint8Array(37)
// Authenticator data is the concatenation of:
// - 32 byte SHA-256 hash of the relying party ID
// - 1 byte for the user verification flag
// - 4 bytes for the signature count
// We fill it all with `0xfe` and set the appropriate user verification flag.
DUMMY_AUTHENTICATOR_DATA.fill(0xfe)
DUMMY_AUTHENTICATOR_DATA[32] = 0x04

/**
 * This method creates a dummy signature for the SafeOperation based on the Safe threshold. We assume that all owners are passkeys
 * This is useful for gas estimations
 * @param signer - The signer
 * @param threshold - The Safe threshold
 * @returns The user operation with the dummy passkey signature
 */
export function getDummySignature(signer: Address, threshold: number): string {
  const signatures = []

  for (let i = 0; i < threshold; i++) {
    const isContractSignature = true
    const passkeySignature = getSignatureBytes({
      authenticatorData: DUMMY_AUTHENTICATOR_DATA,
      clientDataFields: DUMMY_CLIENT_DATA_FIELDS,
      r: BigInt(`0x${'ec'.repeat(32)}`),
      s: BigInt(`0x${'d5a'.repeat(21)}f`)
    })

    signatures.push(new EthSafeSignature(signer, passkeySignature, isContractSignature))
  }

  return encodePacked(['uint48', 'uint48', 'bytes'], [0, 0, buildSignatureBytes(signatures) as Hex])
}

/**
 * Encodes the given WebAuthn signature into a string. This computes the ABI-encoded signature parameters:
 * ```solidity
 * abi.encode(authenticatorData, clientDataFields, r, s);
 * ```
 *
 * @param authenticatorData - The authenticator data as a Uint8Array.
 * @param clientDataFields - The client data fields as a string.
 * @param r - The value of r as a bigint.
 * @param s - The value of s as a bigint.
 * @returns The encoded string.
 */
export function getSignatureBytes({
  authenticatorData,
  clientDataFields,
  r,
  s
}: {
  authenticatorData: Uint8Array
  clientDataFields: string
  r: bigint
  s: bigint
}): string {
  // Helper functions
  // Convert a number to a 64-byte hex string with padded upto Hex string with 32 bytes
  const encodeUint256 = (x: bigint | number) => x.toString(16).padStart(64, '0')
  // Calculate the byte size of the dynamic data along with the length parameter alligned to 32 bytes
  const byteSize = (data: Uint8Array) => 32 * (Math.ceil(data.length / 32) + 1) // +1 is for the length parameter
  // Encode dynamic data padded with zeros if necessary in 32 bytes chunks
  const encodeBytes = (data: Uint8Array) =>
    `${encodeUint256(data.length)}${toHex(data).slice(2)}`.padEnd(byteSize(data) * 2, '0')

  // authenticatorData starts after the first four words.
  const authenticatorDataOffset = 32 * 4
  // clientDataFields starts immediately after the authenticator data.
  const clientDataFieldsOffset = authenticatorDataOffset + byteSize(authenticatorData)

  return (
    '0x' +
    encodeUint256(authenticatorDataOffset) +
    encodeUint256(clientDataFieldsOffset) +
    encodeUint256(r) +
    encodeUint256(s) +
    encodeBytes(authenticatorData) +
    encodeBytes(new TextEncoder().encode(clientDataFields))
  )
}
