import { BlockTag } from 'viem'

export function asBlockId(blockId: number | string | undefined) {
  return typeof blockId === 'number' ? blockNumber(blockId) : blockTag(blockId)
}

function blockNumber(blockNumber: any) {
  return { blockNumber: blockNumber.toNumber() }
}

function blockTag(blockTag: any) {
  return { blockTag: blockTag as BlockTag }
}
