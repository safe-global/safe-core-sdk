import { Signer } from 'ethers'

// TODO: remove this function in favor of viem#pad
function padHex(
  hex: string,
  { dir = 'left', size = 32 }: { dir?: string; size?: number } = {}
): string {
  if (size === null) return hex
  const result = hex.replace('0x', '')
  if (result.length > size * 2) throw new Error(`Size (${result.length}) exceeds padding size.`)

  return `0x${result[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}`
}

export async function signDelegate(signer: Signer, delegateAddress: string, chainId: bigint) {
  const domain = {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: chainId
  }

  const types = {
    Delegate: [
      { name: 'delegateAddress', type: 'bytes32' },
      { name: 'totp', type: 'uint256' }
    ]
  }

  const totp = Math.floor(Date.now() / 1000 / 3600)
  const paddedAddress = padHex(delegateAddress, { size: 32, dir: 'right' })

  return await signer.signTypedData(domain, types, { delegateAddress: paddedAddress, totp })
}
