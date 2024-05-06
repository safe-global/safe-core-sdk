export function padHex(
  hex: string,
  { dir = 'right', size = 32 }: { dir?: string; size?: number } = {}
): string {
  if (size === null) return hex
  const result = hex.replace('0x', '')
  if (result.length > size * 2) throw new Error(`Size (${result.length}) exceeds padding size.`)

  return `0x${result[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}`
}
