import { BlockTag } from 'viem'

export function asBlockId(blockId: BlockTag | number | undefined) {
  if (typeof blockId === 'number') return { blockNumber: BigInt(blockId) }
  return { blockTag: blockId }
}
