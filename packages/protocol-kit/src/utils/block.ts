import { BlockTag } from 'viem'

export function asBlockId(blockId: number | string | undefined) {
  if (typeof blockId === 'number') return { blockNumber: BigInt(blockId) }
  return { blockTag: blockId as BlockTag | undefined }
}
