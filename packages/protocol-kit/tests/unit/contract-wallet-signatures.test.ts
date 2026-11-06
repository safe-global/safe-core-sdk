import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { concat, encodeAbiParameters, numberToHex, padHex, size, type TypedData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import SafeProvider from '../../src/SafeProvider'
import { generateTypedData } from '../../src/utils/eip-712'
import { buildSignatureBytes, generateEIP712Signature } from '../../src/utils/signatures/utils'
import { OperationType, SafeEIP712Args } from '@safe-global/types-kit'

chai.use(chaiAsPromised)

const contractAddress = '0x2222222222222222222222222222222222222222'
const account = privateKeyToAccount(`0x${'01'.padStart(64, '0')}`)
const args: SafeEIP712Args = {
  safeAddress: '0x1111111111111111111111111111111111111111',
  safeVersion: '1.5.0',
  chainId: 1n,
  data: {
    to: contractAddress,
    value: '0',
    data: '0x',
    operation: OperationType.Call,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0
  }
}

describe('EIP-712 signatures from contract wallets', () => {
  const setup = async (signer = contractAddress, typedDataArgs = args) => {
    const provider = sinon.createStubInstance(SafeProvider)
    provider.getSignerAddress.resolves(signer)
    provider.isContractDeployed.resolves(signer === contractAddress)
    const typedData = generateTypedData(typedDataArgs)
    const inner = await account.signTypedData({
      ...typedData,
      types: { ...typedData.types } as TypedData
    })
    return { provider, inner, safeProvider: provider as unknown as SafeProvider }
  }

  it('preserves a Coinbase-style wrapper and encodes the Safe contract-signature envelope', async () => {
    const { provider, inner, safeProvider } = await setup()
    const raw = encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { type: 'uint256', name: 'ownerIndex' },
            { type: 'bytes', name: 'signatureData' }
          ]
        }
      ],
      [{ ownerIndex: 0n, signatureData: inner }]
    )
    provider.signTypedData.resolves(raw)

    const signature = await generateEIP712Signature(safeProvider, args)

    chai.expect(signature.data).to.equal(raw)
    chai.expect(signature.isContractSignature).to.equal(true)
    chai
      .expect(buildSignatureBytes([signature]))
      .to.equal(
        concat([
          padHex(contractAddress, { size: 32 }),
          numberToHex(65, { size: 32 }),
          '0x00',
          numberToHex(size(raw), { size: 32 }),
          raw
        ])
      )
  })

  it('accepts opaque contract signatures whose last byte is not an ECDSA recovery byte', async () => {
    const { provider, safeProvider } = await setup()
    provider.signTypedData.resolves('0xdeadbeef')
    const signature = await generateEIP712Signature(safeProvider, args)
    chai.expect(signature.data).to.equal('0xdeadbeef')
    chai.expect(signature.isContractSignature).to.equal(true)
  })

  it('wraps a 65-byte signature when it recovers an inner owner instead of the wallet', async () => {
    const { provider, inner, safeProvider } = await setup()
    provider.signTypedData.resolves(inner)
    const signature = await generateEIP712Signature(safeProvider, args)
    chai.expect(signature.data).to.equal(inner)
    chai.expect(signature.isContractSignature).to.equal(true)
  })

  it('places the contract payload after all static signatures in a mixed-owner transaction', async () => {
    const contract = await setup()
    contract.provider.signTypedData.resolves('0xdeadbeef')
    const contractSignature = await generateEIP712Signature(contract.safeProvider, args)
    const eoa = await setup(account.address)
    eoa.provider.signTypedData.resolves(eoa.inner)
    const eoaSignature = await generateEIP712Signature(eoa.safeProvider, args)

    chai
      .expect(buildSignatureBytes([eoaSignature, contractSignature]))
      .to.equal(
        concat([
          padHex(contractAddress, { size: 32 }),
          numberToHex(130, { size: 32 }),
          '0x00',
          eoa.inner,
          numberToHex(4, { size: 32 }),
          '0xdeadbeef'
        ])
      )
  })

  it('preserves EOA signing of Safe messages as well as transactions', async () => {
    const messageArgs = { ...args, data: 'A test message' }
    const { provider, inner, safeProvider } = await setup(account.address, messageArgs)
    provider.signTypedData.resolves(inner)
    const signature = await generateEIP712Signature(safeProvider, messageArgs)
    chai.expect(signature.data).to.equal(inner)
    chai.expect(signature.isContractSignature).to.equal(false)
  })

  for (const safeVersion of ['1.4.1', '1.5.0']) {
    for (const ledgerV of [false, true]) {
      it(`preserves EOA signing on Safe ${safeVersion}, Ledger recovery byte: ${ledgerV}`, async () => {
        const typedDataArgs = { ...args, safeVersion }
        const { provider, inner, safeProvider } = await setup(account.address, typedDataArgs)
        const raw = ledgerV
          ? inner.slice(0, -2) + (parseInt(inner.slice(-2), 16) - 27).toString(16).padStart(2, '0')
          : inner
        provider.signTypedData.resolves(raw)

        const signature = await generateEIP712Signature(safeProvider, typedDataArgs)

        chai.expect(signature.data).to.equal(inner)
        chai.expect(signature.isContractSignature).to.equal(false)
        chai.expect(provider.isContractDeployed.called).to.equal(false)
      })
    }
  }

  it('keeps a delegated EOA signature as ECDSA even when the signer has code', async () => {
    const { provider, inner, safeProvider } = await setup(account.address)
    provider.isContractDeployed.resolves(true)
    provider.signTypedData.resolves(inner)
    const signature = await generateEIP712Signature(safeProvider, args)
    chai.expect(signature.isContractSignature).to.equal(false)
    chai.expect(signature.data).to.equal(inner)
  })

  it('propagates code lookup errors instead of returning an incorrectly classified signature', async () => {
    const { provider, safeProvider } = await setup()
    provider.signTypedData.resolves('0xdeadbeef')
    provider.isContractDeployed.rejects(new Error('RPC unavailable'))
    await chai
      .expect(generateEIP712Signature(safeProvider, args))
      .to.be.rejectedWith('RPC unavailable')
  })
})
