import { OperationType, SafeTransaction } from '@safe-global/types-kit'
import { estimateTxBaseGas } from '@safe-global/protocol-kit/utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import * as safeDeploymentContracts from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import chai from 'chai'
import sinon from 'sinon'

const EXISTING_REFUND_RECEIVER = '0x1000000000000000000000000000000000000001'
const NEW_REFUND_RECEIVER = '0x2000000000000000000000000000000000000002'
const ERC20_TOKEN = '0x3000000000000000000000000000000000000003'

describe('estimateTxBaseGas', () => {
  beforeEach(() => {
    sinon
      .stub(safeDeploymentContracts, 'getSafeContract')
      .resolves({ encode: sinon.stub().returns('0x1234') } as any)
  })

  afterEach(() => {
    sinon.restore()
  })

  function buildSafe({
    contractCode = '0x',
    nonce = 0,
    balance = 0n,
    tokenBalance = 0n,
    tokenBalanceReverts = false
  }: {
    contractCode?: string
    nonce?: number
    balance?: bigint
    tokenBalance?: bigint
    tokenBalanceReverts?: boolean
  } = {}) {
    const balanceOfResponse = '0x' + tokenBalance.toString(16).padStart(64, '0')
    const callStub = tokenBalanceReverts
      ? sinon.stub().rejects(new Error('reverted'))
      : sinon.stub().resolves(balanceOfResponse)
    const safeProvider = {
      getContractCode: sinon.stub().resolves(contractCode),
      getNonce: sinon.stub().resolves(nonce),
      getBalance: sinon.stub().resolves(balance),
      call: callStub
    }

    return {
      getThreshold: sinon.stub().resolves(1),
      getNonce: sinon.stub().resolves(1),
      getContractVersion: sinon.stub().returns('1.3.0'),
      getSafeProvider: sinon.stub().returns(safeProvider),
      getContractManager: sinon.stub().returns({
        isL1SafeSingleton: false,
        contractNetworks: {}
      }),
      getChainId: sinon.stub().resolves(1n)
    } as any
  }

  function buildTransaction(overrides: Partial<SafeTransaction['data']> = {}): SafeTransaction {
    return {
      data: {
        to: '0x4000000000000000000000000000000000000004',
        value: '0',
        data: '0x',
        operation: OperationType.Call,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '1',
        gasToken: ZERO_ADDRESS,
        refundReceiver: EXISTING_REFUND_RECEIVER,
        nonce: 1,
        ...overrides
      },
      signatures: new Map(),
      addSignature: sinon.stub(),
      encodedSignatures: sinon.stub().returns('0x')
    } as any
  }

  it('adds the account creation cost for ETH refunds to a fresh refund receiver', async () => {
    const existingSafe = buildSafe({
      contractCode: '0x1234',
      nonce: 1,
      balance: 1n
    })
    const newAccountSafe = buildSafe()

    const existingRefundBaseGas = await estimateTxBaseGas(existingSafe, buildTransaction())
    const newRefundBaseGas = await estimateTxBaseGas(
      newAccountSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(newRefundBaseGas) - Number(existingRefundBaseGas)).to.eq(25_000)
  })

  it('adds extra ERC20 transfer cost when refund receiver has no prior token balance', async () => {
    const existingHolderSafe = buildSafe({ tokenBalance: 1n })
    const newHolderSafe = buildSafe({ tokenBalance: 0n })

    const existingHolderBaseGas = await estimateTxBaseGas(
      existingHolderSafe,
      buildTransaction({ gasToken: ERC20_TOKEN, refundReceiver: NEW_REFUND_RECEIVER })
    )
    const newHolderBaseGas = await estimateTxBaseGas(
      newHolderSafe,
      buildTransaction({ gasToken: ERC20_TOKEN, refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(newHolderBaseGas) - Number(existingHolderBaseGas)).to.eq(17_000)
  })

  it('treats a reverting balanceOf call as a new token holder (conservative)', async () => {
    const existingHolderSafe = buildSafe({ tokenBalance: 1n })
    const revertingSafe = buildSafe({ tokenBalanceReverts: true })

    const existingHolderBaseGas = await estimateTxBaseGas(
      existingHolderSafe,
      buildTransaction({ gasToken: ERC20_TOKEN, refundReceiver: NEW_REFUND_RECEIVER })
    )
    const revertingBaseGas = await estimateTxBaseGas(
      revertingSafe,
      buildTransaction({ gasToken: ERC20_TOKEN, refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(revertingBaseGas) - Number(existingHolderBaseGas)).to.eq(17_000)
  })

  it('does not add the account creation cost when refundReceiver is the zero address', async () => {
    const newAccountSafe = buildSafe()
    const zeroAddressSafe = buildSafe()

    const newReceiverBaseGas = await estimateTxBaseGas(
      newAccountSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )
    const zeroAddressBaseGas = await estimateTxBaseGas(
      zeroAddressSafe,
      buildTransaction({ refundReceiver: ZERO_ADDRESS })
    )

    chai.expect(Number(newReceiverBaseGas) - Number(zeroAddressBaseGas)).to.eq(25_000)
  })

  it('does not add the account creation cost when the receiver has a non-zero balance', async () => {
    const newAccountSafe = buildSafe()
    const fundedSafe = buildSafe({ balance: 1n })

    const newReceiverBaseGas = await estimateTxBaseGas(
      newAccountSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )
    const fundedReceiverBaseGas = await estimateTxBaseGas(
      fundedSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(newReceiverBaseGas) - Number(fundedReceiverBaseGas)).to.eq(25_000)
  })

  it('does not add the account creation cost when the receiver has a non-zero nonce', async () => {
    const newAccountSafe = buildSafe()
    const usedNonceSafe = buildSafe({ nonce: 1 })

    const newReceiverBaseGas = await estimateTxBaseGas(
      newAccountSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )
    const usedNonceReceiverBaseGas = await estimateTxBaseGas(
      usedNonceSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(newReceiverBaseGas) - Number(usedNonceReceiverBaseGas)).to.eq(25_000)
  })

  it('does not add the account creation cost when the receiver is a contract', async () => {
    const newAccountSafe = buildSafe()
    const contractSafe = buildSafe({ contractCode: '0x1234' })

    const newReceiverBaseGas = await estimateTxBaseGas(
      newAccountSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )
    const contractReceiverBaseGas = await estimateTxBaseGas(
      contractSafe,
      buildTransaction({ refundReceiver: NEW_REFUND_RECEIVER })
    )

    chai.expect(Number(newReceiverBaseGas) - Number(contractReceiverBaseGas)).to.eq(25_000)
  })
})
