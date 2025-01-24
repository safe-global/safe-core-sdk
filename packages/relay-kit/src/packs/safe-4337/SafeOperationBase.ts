import { Hex, encodePacked, hashTypedData, toHex } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeOperationOptions,
  SafeSignature,
  SafeUserOperation,
  UserOperation
} from '@safe-global/types-kit'
import Safe, {
  buildSignatureBytes,
  EthSafeSignature,
  SigningMethod
} from '@safe-global/protocol-kit'
import { EIP712_SAFE_OPERATION_TYPE_V06, EIP712_SAFE_OPERATION_TYPE_V07 } from './constants'

abstract class SafeOperationBase implements SafeOperation {
  userOperation: UserOperation
  protocolKit: Safe
  options: SafeOperationOptions
  signatures: Map<string, SafeSignature> = new Map()

  constructor(userOperation: UserOperation, protocolKit: Safe, options: SafeOperationOptions) {
    this.userOperation = userOperation
    this.protocolKit = protocolKit
    this.options = options
  }

  getSignature(signer: string): SafeSignature | undefined {
    return this.signatures.get(signer.toLowerCase())
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    return buildSignatureBytes(Array.from(this.signatures.values()))
  }

  abstract addEstimations(estimations: EstimateGasData): void

  abstract getSafeOperation(): SafeUserOperation

  async sign(signingMethod: SigningMethod = SigningMethod.ETH_SIGN_TYPED_DATA_V4) {
    const safeProvider = this.protocolKit.getSafeProvider()
    const signerAddress = await safeProvider.getSignerAddress()
    const isPasskeySigner = await safeProvider.isPasskeySigner()

    if (!signerAddress) {
      throw new Error('There is no signer address available to sign the SafeOperation')
    }

    const isOwner = await this.protocolKit.isOwner(signerAddress)
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()

    if ((!isOwner && isSafeDeployed) || (!isSafeDeployed && !isPasskeySigner && !isOwner)) {
      throw new Error('UserOperations can only be signed by Safe owners')
    }

    let safeSignature: SafeSignature

    if (isPasskeySigner) {
      const safeOpHash = this.getHash()

      if (!isSafeDeployed) {
        const passkeySignature = await this.protocolKit.signHash(safeOpHash)
        safeSignature = new EthSafeSignature(this.options.sharedSigner, passkeySignature.data, true)
      } else {
        safeSignature = await this.protocolKit.signHash(safeOpHash)
      }
    } else {
      if (
        [
          SigningMethod.ETH_SIGN_TYPED_DATA_V4,
          SigningMethod.ETH_SIGN_TYPED_DATA_V3,
          SigningMethod.ETH_SIGN_TYPED_DATA
        ].includes(signingMethod)
      ) {
        const signer = await safeProvider.getExternalSigner()

        if (!signer) {
          throw new Error('No signer found')
        }

        const signerAddress = signer.account.address
        const safeOperation = this.getSafeOperation()
        const signature = await signer.signTypedData({
          domain: {
            chainId: Number(this.options.chainId),
            verifyingContract: this.options.moduleAddress
          },
          types: this.getEIP712Type(),
          message: {
            ...safeOperation,
            nonce: toHex(safeOperation.nonce),
            validAfter: toHex(safeOperation.validAfter),
            validUntil: toHex(safeOperation.validUntil),
            maxFeePerGas: toHex(safeOperation.maxFeePerGas),
            maxPriorityFeePerGas: toHex(safeOperation.maxPriorityFeePerGas)
          },
          primaryType: 'SafeOp'
        })

        safeSignature = new EthSafeSignature(signerAddress, signature)
      } else {
        const safeOpHash = this.getHash()

        safeSignature = await this.protocolKit.signHash(safeOpHash)
      }
    }

    this.addSignature(safeSignature)
  }

  getUserOperation(): UserOperation {
    return {
      ...this.userOperation,
      signature: encodePacked(
        ['uint48', 'uint48', 'bytes'],
        [
          this.options.validAfter || 0,
          this.options.validUntil || 0,
          this.encodedSignatures() as Hex
        ]
      )
    }
  }

  getHash(): string {
    return hashTypedData({
      domain: {
        chainId: Number(this.options.chainId),
        verifyingContract: this.options.moduleAddress
      },
      types: this.getEIP712Type(),
      primaryType: 'SafeOp',
      message: this.getSafeOperation()
    })
  }

  protected abstract getEIP712Type():
    | typeof EIP712_SAFE_OPERATION_TYPE_V06
    | typeof EIP712_SAFE_OPERATION_TYPE_V07
}

export default SafeOperationBase
