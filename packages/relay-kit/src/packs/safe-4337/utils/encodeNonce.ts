import { toHex } from 'viem'

export function encodeNonce(args: { key: bigint; sequence: bigint }): bigint {
  const key = BigInt(toHex(args.key, { size: 24 }))
  const sequence = BigInt(toHex(args.sequence, { size: 8 }))

  return (key << BigInt(64)) + sequence
}
