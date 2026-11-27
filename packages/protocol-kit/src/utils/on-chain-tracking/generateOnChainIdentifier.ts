import { keccak256, toHex } from 'viem'

/**
 * Generates a hash from the given input string and truncates it to the specified size.
 *
 * @param {string} input - The input string to be hashed.
 * @param {number} size - The number of bytes to take from the end of the hash.
 * @returns {string} A hexadecimal string representation of the truncated hash, without the `0x` prefix.
 */
export function generateHash(input: string, size: number): string {
  const fullHash = keccak256(toHex(input))
  // Take the last X bytes: each byte is 2 hex characters of the digest.
  // (Slicing by `size` characters and re-encoding with toHex() used to return
  // the ASCII encoding of those characters instead of the underlying bytes.)
  return fullHash.slice(-size * 2)
}

export type OnChainIdentifierParamsType = {
  project: string
  platform?: string
  tool: string
  toolVersion: string
}

/**
 * Generates an on-chain identifier for tracking transactions on the blockchain.
 * This identifier includes hashed metadata such as the project name, platform, tool, and tool version.
 *
 * @param {Object} params - An object containing the metadata for generating the on-chain identifier.
 * @param {string} params.project - The name of the project initiating the transaction.
 * @param {string} [params.platform='Web'] - The platform from which the transaction originates (e.g., "Web", "Mobile", "Safe App", "Widget"...).
 * @param {string} params.tool - The tool used to generate the transaction (e.g., "protocol-kit").
 * @param {string} params.toolVersion - The version of the tool used to generate the transaction.
 * @returns {string} A string representing the on-chain identifier, composed of multiple hashed segments.
 *
 * @example
 * const identifier = generateOnChainIdentifier({
 *   project: 'MyProject',
 *   platform: 'Mobile',
 *   tool: 'protocol-kit',
 *   toolVersion: '4.0.0'
 * })
 */
function generateOnChainIdentifier({
  project,
  platform = 'Web',
  tool,
  toolVersion
}: OnChainIdentifierParamsType): string {
  const identifierPrefix = '5afe'
  const identifierVersion = '01' // second version: hashes truncated by bytes, not hex characters
  const projectHash = generateHash(project, 20) // Take the last 20 bytes
  const platformHash = generateHash(platform, 3) // Take the last 3 bytes
  const toolHash = generateHash(tool, 3) // Take the last 3 bytes
  const toolVersionHash = generateHash(toolVersion, 3) // Take the last 3 bytes

  return `${identifierPrefix}${identifierVersion}${projectHash}${platformHash}${toolHash}${toolVersionHash}`
}

export default generateOnChainIdentifier
