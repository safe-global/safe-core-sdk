import { ethers } from 'ethers'
import { EthSafeSignature } from '@safe-global/protocol-kit'
import EthSafeOperation from './SafeOperation'
import * as fixtures from './testing-utils/fixtures'

describe('SafeOperation', () => {
  it('should create a SafeOperation from an UserOperation', () => {
    const safeOperation = new EthSafeOperation(fixtures.USER_OPERATION, {
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(safeOperation.data).toMatchObject({
      safe: fixtures.USER_OPERATION.sender,
      nonce: BigInt(fixtures.USER_OPERATION.nonce),
      initCode: fixtures.USER_OPERATION.initCode,
      callData: fixtures.USER_OPERATION.callData,
      callGasLimit: fixtures.USER_OPERATION.callGasLimit,
      verificationGasLimit: fixtures.USER_OPERATION.verificationGasLimit,
      preVerificationGas: fixtures.USER_OPERATION.preVerificationGas,
      maxFeePerGas: fixtures.USER_OPERATION.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION.maxPriorityFeePerGas,
      paymasterAndData: fixtures.USER_OPERATION.paymasterAndData,
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(safeOperation.signatures.size).toBe(0)
  })

  it('should add and retrieve signatures', () => {
    const safeOperation = new EthSafeOperation(fixtures.USER_OPERATION, {
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    safeOperation.addSignature(new EthSafeSignature('0xSigner', '0xSignature'))

    expect(safeOperation.signatures.size).toBe(1)
    expect(safeOperation.getSignature('0xSigner')).toMatchObject({
      signer: '0xSigner',
      data: '0xSignature',
      isContractSignature: false
    })
  })

  it('should encode the signatures', () => {
    const safeOperation = new EthSafeOperation(fixtures.USER_OPERATION, {
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    safeOperation.addSignature(new EthSafeSignature('0xSigner1', '0xSignature1'))
    safeOperation.addSignature(new EthSafeSignature('0xSigner2', '0xSignature2'))

    expect(safeOperation.encodedSignatures()).toBe('0xSignature1Signature2')
  })

  it('should add estimations', () => {
    const safeOperation = new EthSafeOperation(fixtures.USER_OPERATION, {
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    safeOperation.addEstimations({
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas)
    })

    expect(safeOperation.data).toMatchObject({
      safe: fixtures.USER_OPERATION.sender,
      nonce: BigInt(fixtures.USER_OPERATION.nonce),
      initCode: fixtures.USER_OPERATION.initCode,
      callData: fixtures.USER_OPERATION.callData,
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas),
      maxFeePerGas: fixtures.USER_OPERATION.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION.maxPriorityFeePerGas,
      paymasterAndData: fixtures.USER_OPERATION.paymasterAndData,
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })
  })

  it('should convert to UserOperation', () => {
    const safeOperation = new EthSafeOperation(fixtures.USER_OPERATION, {
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    safeOperation.addSignature(
      new EthSafeSignature(
        '0xSigner',
        '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
      )
    )

    expect(safeOperation.toUserOperation()).toMatchObject({
      sender: safeOperation.data.safe,
      nonce: ethers.toBeHex(fixtures.USER_OPERATION.nonce),
      initCode: safeOperation.data.initCode,
      callData: safeOperation.data.callData,
      callGasLimit: safeOperation.data.callGasLimit,
      verificationGasLimit: safeOperation.data.verificationGasLimit,
      preVerificationGas: safeOperation.data.preVerificationGas,
      maxFeePerGas: safeOperation.data.maxFeePerGas,
      maxPriorityFeePerGas: safeOperation.data.maxPriorityFeePerGas,
      paymasterAndData: safeOperation.data.paymasterAndData,
      signature: ethers.solidityPacked(
        ['uint48', 'uint48', 'bytes'],
        [
          safeOperation.data.validAfter,
          safeOperation.data.validUntil,
          safeOperation.encodedSignatures()
        ]
      )
    })
  })
})
