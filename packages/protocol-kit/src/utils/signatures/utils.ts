import { ethers } from 'ethers'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  SafeSignature,
  SafeEIP712Args,
  SafeTransactionData
} from '@safe-global/safe-core-sdk-types'
import { bufferToHex, ecrecover, pubToAddress } from 'ethereumjs-util'
import semverSatisfies from 'semver/functions/satisfies'
import { sameString } from '../address'
import { EthSafeSignature } from './SafeSignature'
import { getEip712MessageTypes, getEip712TxTypes } from '../eip-712'
import { SigningMethod } from '@safe-global/protocol-kit/types'

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01'

  return new EthSafeSignature(ownerAddress, signature)
}

export function isTxHashSignedWithPrefix(
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

type AdjustVOverload = {
  (signingMethod: SigningMethod.ETH_SIGN_TYPED_DATA, signature: string): string
  (
    signingMethod: SigningMethod.ETH_SIGN,
    signature: string,
    safeTxHash: string,
    sender: string
  ): string
}

export const adjustVInSignature: AdjustVOverload = (
  signingMethod: SigningMethod.ETH_SIGN | SigningMethod.ETH_SIGN_TYPED_DATA,
  signature: string,
  safeTxHash?: string,
  signerAddress?: string
): string => {
  const ETHEREUM_V_VALUES = [0, 1, 27, 28]
  const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27
  let signatureV = parseInt(signature.slice(-2), 16)
  if (!ETHEREUM_V_VALUES.includes(signatureV)) {
    throw new Error('Invalid signature')
  }
  if (signingMethod === SigningMethod.ETH_SIGN) {
    /*
      The Safe's expected V value for ECDSA signature is:
      - 27 or 28
      - 31 or 32 if the message was signed with a EIP-191 prefix. Should be calculated as ECDSA V value + 4
      Some wallets do that, some wallets don't, V > 30 is used by contracts to differentiate between
      prefixed and non-prefixed messages. The only way to know if the message was signed with a
      prefix is to check if the signer address is the same as the recovered address.

      More info:
      https://docs.safe.global/safe-core-protocol/signatures
    */
    if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
      signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
    }
    const adjustedSignature = signature.slice(0, -2) + signatureV.toString(16)
    const signatureHasPrefix = isTxHashSignedWithPrefix(
      safeTxHash as string,
      adjustedSignature,
      signerAddress as string
    )
    if (signatureHasPrefix) {
      signatureV += 4
    }
  }
  if (signingMethod === SigningMethod.ETH_SIGN_TYPED_DATA) {
    // Metamask with ledger returns V=0/1 here too, we need to adjust it to be ethereum's valid value (27 or 28)
    if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
      signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
    }
  }
  signature = signature.slice(0, -2) + signatureV.toString(16)
  return signature
}

export async function generateSignature(
  safeProvider: SafeProvider,
  hash: string
): Promise<SafeSignature> {
  const signerAddress = await safeProvider.getSignerAddress()
  if (!signerAddress) {
    throw new Error('SafeProvider must be initialized with a signer to use this method')
  }

  let signature = await safeProvider.signMessage(hash)

  signature = adjustVInSignature(SigningMethod.ETH_SIGN, signature, hash, signerAddress)
  return new EthSafeSignature(signerAddress, signature)
}

export async function generateEIP712Signature(
  safeProvider: SafeProvider,
  safeEIP712Args: SafeEIP712Args,
  methodVersion?: 'v3' | 'v4'
): Promise<SafeSignature> {
  const signerAddress = await safeProvider.getSignerAddress()
  if (!signerAddress) {
    throw new Error('SafeProvider must be initialized with a signer to use this method')
  }

  //@ts-expect-error: Evaluate removal of methodVersion and use v4
  let signature = await safeProvider.signTypedData(safeEIP712Args, methodVersion)

  signature = adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
  return new EthSafeSignature(signerAddress, signature)
}

export const buildContractSignature = async (
  signatures: SafeSignature[],
  signerSafeAddress: string
): Promise<SafeSignature> => {
  const contractSignature = new EthSafeSignature(
    signerSafeAddress,
    buildSignatureBytes(signatures),
    true
  )

  return contractSignature
}

export const buildSignatureBytes = (signatures: SafeSignature[]): string => {
  const SIGNATURE_LENGTH_BYTES = 65

  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  )

  let signatureBytes = '0x'
  let dynamicBytes = ''

  for (const signature of signatures) {
    if (signature.isContractSignature) {
      /* 
        A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended 
        at the end of signature bytes.
        The signature format is
        Signature type == 0
        Constant part: 65 bytes
        {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
        Dynamic part (solidity bytes): 32 bytes + signature data length
        {32-bytes signature length}{bytes signature data}
      */
      const dynamicPartPosition = (
        signatures.length * SIGNATURE_LENGTH_BYTES +
        dynamicBytes.length / 2
      )
        .toString(16)
        .padStart(64, '0')

      signatureBytes += signature.staticPart(dynamicPartPosition)
      dynamicBytes += signature.dynamicPart()
    } else {
      signatureBytes += signature.data.slice(2)
    }
  }

  return signatureBytes + dynamicBytes
}

export const preimageSafeTransactionHash = (
  safeAddress: string,
  safeTx: SafeTransactionData,
  safeVersion: string,
  chainId: bigint
): string => {
  const safeTxTypes = getEip712TxTypes(safeVersion)

  return ethers.TypedDataEncoder.encode(
    { verifyingContract: safeAddress, chainId },
    { SafeTx: safeTxTypes.SafeTx },
    safeTx
  )
}

export const preimageSafeMessageHash = (
  safeAddress: string,
  message: string,
  safeVersion: string,
  chainId: bigint
): string => {
  const safeMessageTypes = getEip712MessageTypes(safeVersion)

  return ethers.TypedDataEncoder.encode(
    { verifyingContract: safeAddress, chainId },
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message }
  )
}

const EQ_OR_GT_1_3_0 = '>=1.3.0'

export const calculateSafeTransactionHash = (
  safeAddress: string,
  safeTx: SafeTransactionData,
  safeVersion: string,
  chainId: bigint
): string => {
  const safeTxTypes = getEip712TxTypes(safeVersion)
  const domain: {
    chainId?: bigint
    verifyingContract: string
  } = { verifyingContract: safeAddress }

  if (semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)) {
    domain.chainId = chainId
  }

  return ethers.TypedDataEncoder.hash(domain, { SafeTx: safeTxTypes.SafeTx }, safeTx)
}

export const calculateSafeMessageHash = (
  safeAddress: string,
  message: string,
  safeVersion: string,
  chainId: bigint
): string => {
  const safeMessageTypes = getEip712MessageTypes(safeVersion)

  return ethers.TypedDataEncoder.hash(
    { verifyingContract: safeAddress, chainId },
    { SafeMessage: safeMessageTypes.SafeMessage },
    { message }
  )
}
