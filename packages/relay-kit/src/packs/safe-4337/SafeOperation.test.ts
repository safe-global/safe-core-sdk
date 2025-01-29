import { Hex, encodePacked } from 'viem'
import Safe, { EthSafeSignature } from '@safe-global/protocol-kit'
import SafeOperationV06 from './SafeOperationV06'
import * as fixtures from './testing-utils/fixtures'

describe('SafeOperation', () => {
  it('should create a SafeOperation from an UserOperation', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION, new Safe(), {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0],
      sharedSigner: fixtures.SHARED_SIGNER
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
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
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION, new Safe(), {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0],
      sharedSigner: fixtures.SHARED_SIGNER
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
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION, new Safe(), {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0],
      sharedSigner: fixtures.SHARED_SIGNER
    })

    safeOperation.addSignature(new EthSafeSignature('0xSigner1', '0xSignature1'))
    safeOperation.addSignature(new EthSafeSignature('0xSigner2', '0xSignature2'))

    expect(safeOperation.encodedSignatures()).toBe('0xSignature1Signature2')
  })

  it('should add estimations', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION, new Safe(), {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0],
      sharedSigner: fixtures.SHARED_SIGNER
    })

    safeOperation.addEstimations({
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas)
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
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

  it('should retrieve the UserOperation', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION, new Safe(), {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.MODULE_ADDRESS,
      entryPoint: fixtures.ENTRYPOINTS[0],
      sharedSigner: fixtures.SHARED_SIGNER
    })

    safeOperation.addSignature(
      new EthSafeSignature(
        '0xSigner',
        '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
      )
    )

    expect(safeOperation.getUserOperation()).toMatchObject({
      sender: safeOperation.userOperation.sender,
      nonce: fixtures.USER_OPERATION.nonce,
      initCode: safeOperation.userOperation.initCode,
      callData: safeOperation.userOperation.callData,
      callGasLimit: safeOperation.userOperation.callGasLimit,
      verificationGasLimit: safeOperation.userOperation.verificationGasLimit,
      preVerificationGas: safeOperation.userOperation.preVerificationGas,
      maxFeePerGas: safeOperation.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: safeOperation.userOperation.maxPriorityFeePerGas,
      paymasterAndData: safeOperation.userOperation.paymasterAndData,
      signature: encodePacked(
        ['uint48', 'uint48', 'bytes'],
        [
          safeOperation.options.validAfter || 0,
          safeOperation.options.validUntil || 0,
          safeOperation.encodedSignatures() as Hex
        ]
      )
    })
  })
})
