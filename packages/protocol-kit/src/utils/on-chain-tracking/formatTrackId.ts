import { keccak256, toHex } from 'viem'

/**
 * Formats a trackId to convert it into an Ethereum address. This address can be used in
 * fields like `paymentReceiver` and `refundReceiver` to track Safe transactions and deployments.
 *
 * @param {string} trackId - The identifier provided by the user.
 * @returns {`0x${string}`} - The Ethereum address derived from the identifier.
 */
function formatTrackId(trackId: string): `0x${string}` {
  return `0x${keccak256(toHex(trackId)).substring(2, 42)}` // only first 40 chars from the hash
}

export default formatTrackId
