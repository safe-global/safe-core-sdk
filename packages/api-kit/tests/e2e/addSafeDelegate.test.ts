import { Address, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import SafeApiKit, { AddSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { getSafe, PRIVATE_KEY_2 } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: AddSafeDelegateProps['signer']
let delegatorAddress: Address

const { address: safeAddress, version } = getSafe()
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
describe(`[${version}] addSafeDelegate`, () => {
  before(() => {
    safeApiKit = getApiKit()
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY_2)
    })
    delegatorAddress = signer.account.address
  })

  // Always runs (even on failure), so a failed assertion can't orphan the delegate.
  // The delegate is removed from both the Safe scope and the "all Safes" scope.
  afterEach(async () => {
    for (const scope of [{ safeAddress }, {}]) {
      try {
        await safeApiKit.removeSafeDelegate({ ...scope, delegateAddress, delegatorAddress, signer })
      } catch {
        // nothing to remove (e.g. a validation test that added no delegate)
      }
    }
  })

  it('should fail if Label is empty', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: ''
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid label')
  })

  it('should fail if Safe delegate address is empty', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress: '',
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe delegator address is empty', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress: '',
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegator address')
  })

  it('should fail if the delegate is the same as the delegator', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress: delegatorAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Delegate cannot be the same as delegator')
  })

  it('should fail if the signature does not belong to the delegator', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress: '0xe4bb611E4e4164D54Ad7361B9d58b0A1eBD462B8',
      signer,
      label: 'Label'
    }
    await chai.expect(safeApiKit.addSafeDelegate(delegateConfig)).to.be.rejected
  })

  it('should add a new delegate', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({ safeAddress })

    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe?.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.chainId).to.be.equal(config.CHAIN_ID.toString())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({ safeAddress })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate without specifying a Safe', async () => {
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe).to.be.null
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate EIP-3770', async () => {
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress: eip3770SafeAddress,
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })

    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe?.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })
})
