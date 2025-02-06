import { Hex, concat, encodePacked } from 'viem'
import { EthSafeSignature } from '@safe-global/protocol-kit'
import { fixtures } from '@safe-global/relay-kit/test-utils'
import SafeOperationV07 from './SafeOperationV07'
import SafeOperationBase from './SafeOperationBase'

describe('SafeOperationV07', () => {
  it('should be an instance of SafeOperationBase', () => {
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V06, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    expect(safeOperation).toBeInstanceOf(SafeOperationBase)
    expect(safeOperation).toBeInstanceOf(SafeOperationV07)
  })

  it('should create a SafeOperation from an UserOperation', () => {
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V07, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
      safe: fixtures.USER_OPERATION_V07.sender,
      nonce: fixtures.USER_OPERATION_V07.nonce,
      initCode: concat([
        safeOperation.userOperation.factory as Hex,
        (safeOperation.userOperation.factoryData as Hex) || ('0x' as Hex)
      ]),
      callData: fixtures.USER_OPERATION_V07.callData,
      callGasLimit: fixtures.USER_OPERATION_V07.callGasLimit,
      verificationGasLimit: fixtures.USER_OPERATION_V07.verificationGasLimit,
      preVerificationGas: fixtures.USER_OPERATION_V07.preVerificationGas,
      maxFeePerGas: fixtures.USER_OPERATION_V07.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION_V07.maxPriorityFeePerGas,
      paymasterAndData: '0x',
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    expect(safeOperation.signatures.size).toBe(0)
  })

  it('should add estimations', () => {
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V07, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    safeOperation.addEstimations({
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas)
    })

    expect(safeOperation.getSafeOperation()).toMatchObject({
      safe: fixtures.USER_OPERATION_V07.sender,
      nonce: fixtures.USER_OPERATION_V07.nonce,
      initCode: concat([
        safeOperation.userOperation.factory as Hex,
        (safeOperation.userOperation.factoryData as Hex) || ('0x' as Hex)
      ]),
      callData: fixtures.USER_OPERATION_V07.callData,
      callGasLimit: BigInt(fixtures.GAS_ESTIMATION.callGasLimit),
      verificationGasLimit: BigInt(fixtures.GAS_ESTIMATION.verificationGasLimit),
      preVerificationGas: BigInt(fixtures.GAS_ESTIMATION.preVerificationGas),
      maxFeePerGas: fixtures.USER_OPERATION_V07.maxFeePerGas,
      maxPriorityFeePerGas: fixtures.USER_OPERATION_V07.maxPriorityFeePerGas,
      paymasterAndData: '0x',
      validAfter: 0,
      validUntil: 0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })
  })

  it('should retrieve the UserOperation', () => {
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V07, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    safeOperation.addSignature(
      new EthSafeSignature(
        '0xSigner',
        '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
      )
    )

    expect(safeOperation.getUserOperation()).toMatchObject({
      sender: safeOperation.userOperation.sender,
      nonce: fixtures.USER_OPERATION_V07.nonce,
      factory: fixtures.USER_OPERATION_V07.factory,
      factoryData: fixtures.USER_OPERATION_V07.factoryData,
      callData: safeOperation.userOperation.callData,
      callGasLimit: safeOperation.userOperation.callGasLimit,
      verificationGasLimit: safeOperation.userOperation.verificationGasLimit,
      preVerificationGas: safeOperation.userOperation.preVerificationGas,
      maxFeePerGas: safeOperation.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: safeOperation.userOperation.maxPriorityFeePerGas,
      paymaster: safeOperation.userOperation.paymaster,
      paymasterData: safeOperation.userOperation.paymasterData,
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
