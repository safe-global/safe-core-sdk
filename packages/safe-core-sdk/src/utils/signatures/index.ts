import { bufferToHex, ecrecover, pubToAddress } from 'ethereumjs-util'
import { Signer } from 'ethers'
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

function isWalletConnectProvider(signer: Signer) {
  return !!((signer?.provider as any)?.provider?.wc)
}

async function generateWalletConnectSignature(ethers: any, hash: string, signer: Signer): Promise<string> {
  console.log("wc", hash, hash.length)
  const prefix = ethers.utils.toUtf8Bytes(`\x19Ethereum Signed Message:\n${hash.length}`)
  //const message = ethers.utils.concat([prefix, hash])
  const keccakMessage = ethers.utils.keccak256(/*prefix +*/ hash)
  const wc = (signer?.provider as any)?.provider
  const signature = await wc.connector.signMessage([await signer.getAddress(), keccakMessage])
  return signature
}

function isTxHashSignedWithPrefix(
  txHash: string,
  signature: string,
  ownerAddress: string
): boolean {
  let hasPrefix
  console.log({ownerAddress})
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
    console.log({recoveredAddress})
    hasPrefix = !sameString(recoveredAddress, ownerAddress)
  } catch (e) {
    console.log(e)
    hasPrefix = true
  }
  return hasPrefix
}

function adjustVInSignature(signature: string, hasPrefix: boolean) {
  console.log({hasPrefix})
  let signatureV = parseInt(signature.slice(-2), 16)
  console.log({signatureV})
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
  console.log({signatureV})
  signature = signature.slice(0, -2) + signatureV.toString(16)
  console.log({signature})
  return signature
}

export async function generateSignature(
  ethers: any,
  signer: Signer,
  hash: string
): Promise<EthSignSignature> {
  const signerAddress = await signer.getAddress()
  const messageArray = ethers.utils.arrayify(hash)
  let signature: string
  if (isWalletConnectProvider(signer)) {
    signature = await generateWalletConnectSignature(ethers, messageArray, signer)
  } else {
    signature = await signer.signMessage(messageArray)
  }
  const hasPrefix = isTxHashSignedWithPrefix(hash, signature, signerAddress)
  signature = adjustVInSignature(signature, hasPrefix)
  return new EthSignSignature(signerAddress, signature)
}
