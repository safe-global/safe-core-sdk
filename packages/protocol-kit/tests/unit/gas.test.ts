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

  // --- Per-chain cold-storage repricing (PLA-1651) ---------------------------------------------
  // Polygon PoS (137) raises COLD_SLOAD_COST 2_100 -> 5_460 and COLD_SSTORE_COST 2_100 -> 2_940
  // (PIP-88 / Chicago hard fork). baseGas must scale the cold SLOADs/SSTOREs it counts.

  function buildSafeOnChain(chainId: bigint, overrides = {}) {
    const safe = buildSafe(overrides)
    safe.getChainId = sinon.stub().resolves(chainId)
    return safe
  }

  it('scales the cold SLOADs counted in baseGas for Polygon (PIP-88) vs an EIP-2929 chain', async () => {
    // Initialized Safe (nonce != 0): the only per-chain difference is the cold SLOAD price,
    // applied to the 3 cold SLOADs counted in EXTRA_BASE (threshold + getGuard + owners lookup).
    const ethereumSafe = buildSafeOnChain(1n)
    const polygonSafe = buildSafeOnChain(137n)

    const ethereumBaseGas = await estimateTxBaseGas(ethereumSafe, buildTransaction())
    const polygonBaseGas = await estimateTxBaseGas(polygonSafe, buildTransaction())

    // 3 cold SLOADs * (5_460 - 2_100) = 3 * 3_360 = 10_080
    chai.expect(Number(polygonBaseGas) - Number(ethereumBaseGas)).to.eq(10_080)
  })

  it('scales the cold SSTORE nonce initialization for Polygon when the Safe is uninitialized', async () => {
    // Uninitialized Safe (nonce == 0): adds the cold SSTORE set surcharge difference on top of
    // the 3 cold SLOAD difference.
    const ethereumSafe = buildSafeOnChain(1n)
    const polygonSafe = buildSafeOnChain(137n)
    ethereumSafe.getNonce = sinon.stub().resolves(0)
    polygonSafe.getNonce = sinon.stub().resolves(0)

    const ethereumBaseGas = await estimateTxBaseGas(ethereumSafe, buildTransaction())
    const polygonBaseGas = await estimateTxBaseGas(polygonSafe, buildTransaction())

    // cold SLOAD delta (10_080) + cold SSTORE set delta (2_940 - 2_100 = 840) = 10_920
    chai.expect(Number(polygonBaseGas) - Number(ethereumBaseGas)).to.eq(10_920)
  })

  it('uses the EIP-2929 default for chains without a repricing entry', async () => {
    // A chain with no entry in the lookup must behave exactly like Ethereum mainnet.
    const ethereumSafe = buildSafeOnChain(1n)
    const arbitrumSafe = buildSafeOnChain(42161n)

    const ethereumBaseGas = await estimateTxBaseGas(ethereumSafe, buildTransaction())
    const arbitrumBaseGas = await estimateTxBaseGas(arbitrumSafe, buildTransaction())

    chai.expect(Number(arbitrumBaseGas)).to.eq(Number(ethereumBaseGas))
  })
})
