import { Hex, encodePacked } from 'viem'
import { EthSafeSignature } from '@safe-global/protocol-kit'
import { fixtures } from '@safe-global/relay-kit/test-utils'
import SafeOperationV06 from './SafeOperationV06'
import SafeOperationBase from './SafeOperationBase'

describe('SafeOperationV06', () => {
  it('should be an instance of SafeOperationBase', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION_V06, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_2_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })

    expect(safeOperation).toBeInstanceOf(SafeOperationBase)
    expect(safeOperation).toBeInstanceOf(SafeOperationV06)
  })

  it('should create a SafeOperation from an UserOperation', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION_V06, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_2_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
      safe: fixtures.USER_OPERATION_V06.sender,
      nonce: fixtures.USER_OPERATION_V06.nonce,
      initCode: fixtures.USER_OPERATION_V06.initCode,
      callData: fixtures.USER_OPERATION_V06.callData,
      callGasLimit: fixtures.USER_OPERATION_V06.callGasLimit,
      verificationGasLimit: fixtures.USER_OPERATION_V06.verificationGasLimit,
      preVerificationGas: fixtures.USER_OPERATION_V06.preVerificationGas,
      maxFeePerGas: fixtures.USER_OPERATION_V06.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION_V06.maxPriorityFeePerGas,
      paymasterAndData: fixtures.USER_OPERATION_V06.paymasterAndData,
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })

    expect(safeOperation.signatures.size).toBe(0)
  })

  it('should add estimations', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION_V06, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_2_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })

    safeOperation.addEstimations({
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas)
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
      safe: fixtures.USER_OPERATION_V06.sender,
      nonce: fixtures.USER_OPERATION_V06.nonce,
      initCode: fixtures.USER_OPERATION_V06.initCode,
      callData: fixtures.USER_OPERATION_V06.callData,
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas),
      maxFeePerGas: fixtures.USER_OPERATION_V06.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION_V06.maxPriorityFeePerGas,
      paymasterAndData: fixtures.USER_OPERATION_V06.paymasterAndData,
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })
  })

  it('should retrieve the UserOperation', () => {
    const safeOperation = new SafeOperationV06(fixtures.USER_OPERATION_V06, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_2_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V06
    })

    safeOperation.addSignature(
      new EthSafeSignature(
        '0xSigner',
        '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
      )
    )

    expect(safeOperation.getUserOperation()).toMatchObject({
      sender: safeOperation.userOperation.sender,
      nonce: fixtures.USER_OPERATION_V06.nonce,
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
