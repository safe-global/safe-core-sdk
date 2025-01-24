import { Hex, concat, encodePacked, isAddress, pad, toHex } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeOperationOptions,
  SafeSignature,
  SafeUserOperation,
  UserOperation,
  UserOperationV06,
  UserOperationV07
} from '@safe-global/types-kit'
import Safe, {
  buildSignatureBytes,
  EthSafeSignature,
  SigningMethod
} from '@safe-global/protocol-kit'
import { calculateSafeUserOperationHash } from './utils'
import { isEntryPointV7 } from './utils/entrypoint'
import { EIP712_SAFE_OPERATION_TYPE_V06, EIP712_SAFE_OPERATION_TYPE_V07 } from './constants'

class EthSafeOperation implements SafeOperation {
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

  addEstimations(estimations: EstimateGasData): void {
    const userOpV06 = this.userOperation as UserOperationV06
    userOpV06.maxFeePerGas = BigInt(estimations.maxFeePerGas || userOpV06.maxFeePerGas)
    userOpV06.maxPriorityFeePerGas = BigInt(
      estimations.maxPriorityFeePerGas || userOpV06.maxPriorityFeePerGas
    )
    userOpV06.verificationGasLimit = BigInt(
      estimations.verificationGasLimit || userOpV06.verificationGasLimit
    )
    userOpV06.preVerificationGas = BigInt(
      estimations.preVerificationGas || userOpV06.preVerificationGas
    )
    userOpV06.callGasLimit = BigInt(estimations.callGasLimit || userOpV06.callGasLimit)

    userOpV06.paymasterAndData = estimations.paymasterAndData || userOpV06.paymasterAndData

    if (isEntryPointV7(this.options.entryPoint)) {
      const userOp = this.userOperation as UserOperationV07
      userOp.paymasterPostOpGasLimit = estimations.paymasterPostOpGasLimit
        ? BigInt(estimations.paymasterPostOpGasLimit)
        : userOp.paymasterPostOpGasLimit
      userOp.paymasterVerificationGasLimit = estimations.paymasterVerificationGasLimit
        ? BigInt(estimations.paymasterVerificationGasLimit)
        : userOp.paymasterVerificationGasLimit
      userOp.paymaster = estimations.paymaster || userOp.paymaster
      userOp.paymasterData = estimations.paymasterData || userOp.paymasterData
    }
  }

  getSafeOperation(): SafeUserOperation {
    let initCode
    let paymasterAndData

    if (isEntryPointV7(this.options.entryPoint)) {
      const userOpV07 = this.userOperation as UserOperationV07

      initCode = userOpV07.factory
        ? concat([userOpV07.factory as Hex, (userOpV07.factoryData as Hex) || ('0x' as Hex)])
        : '0x'

      paymasterAndData = isAddress(userOpV07.paymaster || '')
        ? concat([
            userOpV07.paymaster as Hex,
            pad(toHex(userOpV07.paymasterVerificationGasLimit || 0n), {
              size: 16
            }),
            pad(toHex(userOpV07.paymasterPostOpGasLimit || 0n), {
              size: 16
            }),
            (userOpV07.paymasterData as Hex) || ('0x' as Hex)
          ])
        : '0x'
    } else {
      const userOpV06 = this.userOperation as UserOperationV06

      initCode = userOpV06.initCode
      paymasterAndData = userOpV06.paymasterAndData
    }

    return {
      safe: this.userOperation.sender,
      nonce: BigInt(this.userOperation.nonce),
      initCode,
      callData: this.userOperation.callData,
      callGasLimit: this.userOperation.callGasLimit,
      verificationGasLimit: this.userOperation.verificationGasLimit,
      preVerificationGas: this.userOperation.preVerificationGas,
      maxFeePerGas: this.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: this.userOperation.maxPriorityFeePerGas,
      paymasterAndData,
      validAfter: this.options.validAfter || 0,
      validUntil: this.options.validUntil || 0,
      entryPoint: this.options.entryPoint
    }
  }

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

      // if the Safe is not deployed we force the Shared Signer signature
      if (!isSafeDeployed) {
        const passkeySignature = await this.protocolKit.signHash(safeOpHash)
        // SafeWebAuthnSharedSigner signature
        safeSignature = new EthSafeSignature(
          this.options.sharedSigner,
          passkeySignature.data,
          true // passkeys are contract signatures
        )
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

        const chainId = await safeProvider.getChainId()
        const signerAddress = signer.account.address
        const safeOperation = this.getSafeOperation()
        const signature = await signer.signTypedData({
          domain: {
            chainId: Number(chainId),
            verifyingContract: this.options.moduleAddress
          },
          types: isEntryPointV7(this.options.entryPoint)
            ? EIP712_SAFE_OPERATION_TYPE_V07
            : EIP712_SAFE_OPERATION_TYPE_V06,
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
    return calculateSafeUserOperationHash(
      this.getSafeOperation(),
      this.options.chainId,
      this.options.moduleAddress,
      this.options.entryPoint
    )
  }
}

export default EthSafeOperation
