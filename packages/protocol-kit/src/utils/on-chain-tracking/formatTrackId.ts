import { keccak256, toHex } from 'viem'

/**
 * Converts a trackId into a hash for tracking Safe transactions and deployments on a blockchain.
 * This function converts the provided trackId to hexadecimal format, hashes it using keccak256,
 * and returns the first 40 characters of the hash (excluding the '0x' prefix).
 *
 * @param {string} trackId - The identifier provided by the user to be formatted into a hash.
 * @returns {string} - A 40-character hexadecimal string representing the hash of the trackId.
 */
function formatTrackId(trackId: string): string {
  return keccak256(toHex(trackId)).substring(2, 42) // only first 40 chars from the hash (excluding the '0x' prefix)
}

export default formatTrackId
