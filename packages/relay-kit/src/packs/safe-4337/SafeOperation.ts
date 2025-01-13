import { Hex, concat, encodePacked, pad, toHex, hexToBytes, sliceHex, getAddress } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeSignature,
  SafeUserOperation,
  UserOperation,
  UserOperationV06,
  UserOperationV07
} from '@safe-global/types-kit'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { calculateSafeUserOperationHash } from './utils'
import { isEntryPointV6, isEntryPointV7 } from './utils/entrypoint'

type SafeOperationOptions = {
  moduleAddress: string
  entryPoint: string
  chainId: bigint
  validAfter?: number
  validUntil?: number
}

class EthSafeOperation implements SafeOperation {
  data: SafeUserOperation
  signatures: Map<string, SafeSignature> = new Map()
  moduleAddress: string
  chainId: bigint
  entryPoint: string

  constructor(
    userOperation: UserOperation,
    { chainId, entryPoint, validAfter, validUntil, moduleAddress }: SafeOperationOptions
  ) {
    this.chainId = chainId
    this.moduleAddress = moduleAddress
    this.entryPoint = entryPoint

    let initCode
    let paymasterAndData

    console.log('userOperation', userOperation)

    if (isEntryPointV7(entryPoint)) {
      const userOpV07 = userOperation as UserOperationV07

      initCode = userOpV07.factory
        ? concat([userOpV07.factory as Hex, (userOpV07.factoryData as Hex) || ('0x' as Hex)])
        : '0x'
      paymasterAndData = userOpV07.paymaster
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
      const userOpV06 = userOperation as UserOperationV06

      initCode = userOpV06.initCode
      paymasterAndData = userOpV06.paymasterAndData
    }

    this.data = {
      safe: userOperation.sender,
      nonce: BigInt(userOperation.nonce),
      initCode,
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit,
      verificationGasLimit: userOperation.verificationGasLimit,
      preVerificationGas: userOperation.preVerificationGas,
      maxFeePerGas: userOperation.maxFeePerGas,
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
      paymasterAndData,
      validAfter: validAfter || 0,
      validUntil: validUntil || 0,
      entryPoint
    }
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
    const keys: (keyof EstimateGasData)[] = [
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'verificationGasLimit',
      'preVerificationGas',
      'callGasLimit'
    ]

    for (const key of keys) {
      this.data[key] = BigInt(estimations[key] || this.data[key])
    }
  }

  toUserOperation(): UserOperation {
    if (isEntryPointV6(this.entryPoint)) {
      return {
        sender: this.data.safe,
        nonce: toHex(this.data.nonce),
        initCode: this.data.initCode,
        callData: this.data.callData,
        callGasLimit: this.data.callGasLimit,
        verificationGasLimit: this.data.verificationGasLimit,
        preVerificationGas: this.data.preVerificationGas,
        maxFeePerGas: this.data.maxFeePerGas,
        maxPriorityFeePerGas: this.data.maxPriorityFeePerGas,
        paymasterAndData: this.data.paymasterAndData,
        signature: encodePacked(
          ['uint48', 'uint48', 'bytes'],
          [this.data.validAfter, this.data.validUntil, this.encodedSignatures() as Hex]
        )
      }
    }

    const factoryData = this.unpackInitCode(this.data.initCode)
    const paymasterData = this.unpackPaymasterAndData(this.data.paymasterAndData)

    return {
      sender: this.data.safe,
      nonce: toHex(this.data.nonce),
      ...factoryData,
      callData: this.data.callData,
      callGasLimit: this.data.callGasLimit,
      verificationGasLimit: this.data.verificationGasLimit,
      preVerificationGas: this.data.preVerificationGas,
      maxFeePerGas: this.data.maxFeePerGas,
      maxPriorityFeePerGas: this.data.maxPriorityFeePerGas,
      ...paymasterData,
      signature: encodePacked(
        ['uint48', 'uint48', 'bytes'],
        [this.data.validAfter, this.data.validUntil, this.encodedSignatures() as Hex]
      )
    }
  }

  getHash(): string {
    return calculateSafeUserOperationHash(this.data, this.chainId, this.moduleAddress)
  }

  unpackPaymasterAndData(
    paymasterAndData: string
  ): Pick<
    UserOperationV07,
    'paymaster' | 'paymasterVerificationGasLimit' | 'paymasterPostOpGasLimit' | 'paymasterData'
  > {
    const paymasterAndDataBytes = hexToBytes(paymasterAndData as Hex)
    const isZero = paymasterAndDataBytes.every((byte) => byte === 0)

    return paymasterAndDataBytes.length > 0 && !isZero
      ? {
          paymaster: getAddress(sliceHex(paymasterAndData as Hex, 0, 20)),
          paymasterVerificationGasLimit: BigInt(sliceHex(paymasterAndData as Hex, 20, 36)),
          paymasterPostOpGasLimit: BigInt(sliceHex(paymasterAndData as Hex, 36, 52)),
          paymasterData: sliceHex(paymasterAndData as Hex, 52)
        }
      : {
          paymaster: '0x',
          paymasterData: '0x',
          paymasterVerificationGasLimit: undefined,
          paymasterPostOpGasLimit: undefined
        }
  }

  unpackInitCode(initCode: string): Pick<UserOperationV07, 'factory' | 'factoryData'> {
    const initCodeBytes = hexToBytes(initCode as Hex)

    return initCodeBytes.length > 0
      ? {
          factory: getAddress(sliceHex(initCode as Hex, 0, 20)),
          factoryData: sliceHex(initCode as Hex, 20)
        }
      : {}
  }
}

export default EthSafeOperation
