import { Address, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import SafeApiKit, { AddDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'
import { getSafe, PRIVATE_KEY_2 } from '../../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: AddDelegateProps['signer']
let delegatorAddress: Address

const { address: safeAddress, version, owners } = getSafe()
// One delegate per Safe version: the CI matrix runs the three versions in parallel against the
// same hosted queue, and the delegation without a Safe is shared by all of them otherwise
const delegateAddress = owners[2]
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

  // Runs before and after each test (even on failure), so a failed run can't orphan the delegate.
  // The delegate is removed from both the Safe scope and the "all Safes" scope.
  const cleanup = async () => {
    for (const scope of [{ safeAddress }, {}]) {
      try {
        await safeApiKit.queue.removeDelegate({
          ...scope,
          delegateAddress,
          delegatorAddress,
          signer
        })
      } catch {
        // nothing to remove (e.g. a validation test that added no delegate)
      }
    }
  }
  beforeEach(cleanup)
  afterEach(cleanup)

  it('should fail if Label is empty', async () => {
    const delegateConfig: AddDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: ''
    }
    await chai
      .expect(safeApiKit.queue.addDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid label')
  })

  it('should fail if Safe delegate address is empty', async () => {
    const delegateConfig: AddDelegateProps = {
      delegateAddress: '',
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.queue.addDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe delegator address is empty', async () => {
    const delegateConfig: AddDelegateProps = {
      delegateAddress,
      delegatorAddress: '',
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.queue.addDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegator address')
  })

  it('should fail if the delegate is the same as the delegator', async () => {
    const delegateConfig: AddDelegateProps = {
      safeAddress,
      delegateAddress: delegatorAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.queue.addDelegate(delegateConfig))
      .to.be.rejectedWith('Delegate cannot be the same as delegator')
  })

  it('should fail if the signature does not belong to the delegator', async () => {
    const delegateConfig: AddDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress: '0xe4bb611E4e4164D54Ad7361B9d58b0A1eBD462B8',
      signer,
      label: 'Label'
    }
    await chai.expect(safeApiKit.queue.addDelegate(delegateConfig)).to.be.rejected
  })

  it('should add a new delegate', async () => {
    const delegateConfig: AddDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.queue.getDelegates({ safeAddress })

    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.queue.addDelegate(delegateConfig)
    chai.expect(delegateResponse.safe?.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.chainId).to.be.equal(config.CHAIN_ID.toString())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.queue.getDelegates({ safeAddress })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.queue.removeDelegate(delegateConfig)
  })

  it('should add a new delegate without specifying a Safe', async () => {
    const delegateConfig: AddDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.queue.getDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.queue.addDelegate(delegateConfig)
    chai.expect(delegateResponse.safe).to.be.null
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.queue.getDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.queue.removeDelegate(delegateConfig)
  })

  it('should add a new delegate EIP-3770', async () => {
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    const delegateConfig: AddDelegateProps = {
      safeAddress: eip3770SafeAddress,
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.queue.getDelegates({
      safeAddress: eip3770SafeAddress
    })

    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.queue.addDelegate(delegateConfig)
    chai.expect(delegateResponse.safe?.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())
    chai
      .expect(delegateResponse.delegator.toLowerCase())
      .to.be.equal(delegatorAddress.toLowerCase())
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.queue.getDelegates({
      safeAddress: eip3770SafeAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.queue.removeDelegate(delegateConfig)
  })
})
