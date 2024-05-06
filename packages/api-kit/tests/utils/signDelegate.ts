import { Signer } from 'ethers'
import { zeroPadValue } from '@safe-global/api-kit/utils/data'

export async function signDelegate(signer: Signer, delegateAddress: string, chainId: string) {
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
  const paddedAddress = zeroPadValue(delegateAddress, { size: 32 })

  return await signer.signTypedData(domain, types, { delegateAddress: paddedAddress, totp })
}
