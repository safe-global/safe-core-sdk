import { bufferToHex, ecrecover, pubToAddress } from 'ethereumjs-util'
import EthAdapter from 'ethereumLibs/EthAdapter'
import { sameString } from '../../utils'
import { EthSignSignature, SafeSignature } from './SafeSignature'

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01'

  return new EthSignSignature(ownerAddress, signature)
}

export async function generateSignature(
  ethAdapter: EthAdapter,
  hash: string
): Promise<EthSignSignature> {
  const signerAddress = await ethAdapter.getSignerAddress()
  let signature = await ethAdapter.signMessage(hash, signerAddress)
  const hasPrefix = isTxHashSignedWithPrefix(hash, signature, signerAddress)
  let signatureV = parseInt(signature.slice(-2), 16)
  switch (signatureV) {
    case 0:
    case 1:
      signatureV += 31
      break
    case 27:
    case 28:
      if (hasPrefix) {
        signatureV += 4
      }
      break
    default:
      throw new Error('Invalid signature')
  }
  signature = signature.slice(0, -2) + signatureV.toString(16)
  return new EthSignSignature(signerAddress, signature)
}

function isTxHashSignedWithPrefix(
  txHash: string,
  signature: string,
  ownerAddress: string
): boolean {
  let hasPrefix
  try {
    const rsvSig = {
      r: Buffer.from(signature.slice(2, 66), 'hex'),
      s: Buffer.from(signature.slice(66, 130), 'hex'),
      v: parseInt(signature.slice(130, 132), 16)
    }
    const recoveredData = ecrecover(
      Buffer.from(txHash.slice(2), 'hex'),
      rsvSig.v,
      rsvSig.r,
      rsvSig.s
    )
    const recoveredAddress = bufferToHex(pubToAddress(recoveredData))
    hasPrefix = !sameString(recoveredAddress, ownerAddress)
  } catch (e) {
    hasPrefix = true
  }
  return hasPrefix
}
