import { EthSafeSignature } from '@safe-global/protocol-kit'
import SafeOperationV07 from './SafeOperationV07'
import { fixtures } from '@safe-global/relay-kit/test-utils'

describe('SafeOperationBase', () => {
  it('should add and get signatures', () => {
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V07, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
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
    const safeOperation = new SafeOperationV07(fixtures.USER_OPERATION_V07, {
      chainId: BigInt(fixtures.CHAIN_ID),
      moduleAddress: fixtures.SAFE_4337_MODULE_ADDRESS_V0_3_0,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07
    })

    safeOperation.addSignature(new EthSafeSignature('0xSigner1', '0xSignature1'))
    safeOperation.addSignature(new EthSafeSignature('0xSigner2', '0xSignature2'))

    expect(safeOperation.encodedSignatures()).toBe('0xSignature1Signature2')
  })
})
