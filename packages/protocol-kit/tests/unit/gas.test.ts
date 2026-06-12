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
    // Long enough to keep baseGas in the 3-byte range (>= 65_536) so the calldata-encoding
    // adjustment for the final baseGas value contributes the same number of bytes for every
    // test case — otherwise crossing the 2->3 byte boundary adds +12 gas to the delta.
    const execTransactionDataStub = '0x' + '12'.repeat(500)
    sinon
      .stub(safeDeploymentContracts, 'getSafeContract')
      .resolves({ encode: sinon.stub().returns(execTransactionDataStub) } as any)
  })

  afterEach(() => {
    sinon.restore()
  })

  const SAFE_ADDRESS = '0x5000000000000000000000000000000000000005'

  function buildSafe({
    contractCode = '0x',
    nonce = 0,
    balance = 0n,
    tokenBalance = 0n,
    tokenBalanceReverts = false,
    probeReturnGas
  }: {
    contractCode?: string
    nonce?: number
    balance?: bigint
    tokenBalance?: bigint
    tokenBalanceReverts?: boolean
    probeReturnGas?: bigint
  } = {}) {
    const balanceOfResponse = '0x' + tokenBalance.toString(16).padStart(64, '0')
    const callStub = tokenBalanceReverts
      ? sinon.stub().rejects(new Error('reverted'))
      : sinon.stub().resolves(balanceOfResponse)
    const estimateGasStub =
      probeReturnGas !== undefined
        ? sinon.stub().resolves(probeReturnGas.toString())
        : sinon.stub().rejects(new Error('probe reverted'))
    const safeProvider = {
      getContractCode: sinon.stub().resolves(contractCode),
      getNonce: sinon.stub().resolves(nonce),
      getBalance: sinon.stub().resolves(balance),
      call: callStub,
      estimateGas: estimateGasStub
    }

    return {
      getAddress: sinon.stub().resolves(SAFE_ADDRESS),
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

  describe('ERC20 refund probe', () => {
    // probeReturnGas - 21_000 (intrinsic) - 356 (transfer calldata) + 2_600 (cold CALL) = -18_756
    const PROBE_FRAMING_ADJUSTMENT = 18_756
    const ERC20_TRANSFER_FALLBACK = 21_000
    const buildErc20Tx = () =>
      buildTransaction({ gasToken: ERC20_TOKEN, refundReceiver: NEW_REFUND_RECEIVER })

    it('uses the probed gas when it exceeds the static fallback', async () => {
      const probedSafe = buildSafe({ tokenBalance: 1n, probeReturnGas: 50_000n })
      const fallbackSafe = buildSafe({ tokenBalance: 1n })

      const probedBaseGas = await estimateTxBaseGas(probedSafe, buildErc20Tx())
      const fallbackBaseGas = await estimateTxBaseGas(fallbackSafe, buildErc20Tx())

      const expectedDelta = 50_000 - PROBE_FRAMING_ADJUSTMENT - ERC20_TRANSFER_FALLBACK
      chai.expect(Number(probedBaseGas) - Number(fallbackBaseGas)).to.eq(expectedDelta)
    })

    it('falls back to the static constant when the adjusted probe is below the floor', async () => {
      const probedSafe = buildSafe({ tokenBalance: 1n, probeReturnGas: 30_000n })
      const fallbackSafe = buildSafe({ tokenBalance: 1n })

      const probedBaseGas = await estimateTxBaseGas(probedSafe, buildErc20Tx())
      const fallbackBaseGas = await estimateTxBaseGas(fallbackSafe, buildErc20Tx())

      chai.expect(Number(probedBaseGas) - Number(fallbackBaseGas)).to.eq(0)
    })

    it('probes with transfer(refundReceiver, 1) from the Safe to the gasToken', async () => {
      const safe = buildSafe({ tokenBalance: 1n, probeReturnGas: 50_000n })
      await estimateTxBaseGas(safe, buildErc20Tx())

      const args = (safe.getSafeProvider().estimateGas as sinon.SinonStub).firstCall.args[0]
      chai.expect(args.to.toLowerCase()).to.eq(ERC20_TOKEN.toLowerCase())
      chai.expect(args.from.toLowerCase()).to.eq(SAFE_ADDRESS.toLowerCase())
      chai.expect(args.data.startsWith('0xa9059cbb')).to.eq(true)
    })
  })
})
