import { EthSignSignature, SafeSignature } from './SafeSignature'

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01'

  return new EthSignSignature(ownerAddress, signature)
}
