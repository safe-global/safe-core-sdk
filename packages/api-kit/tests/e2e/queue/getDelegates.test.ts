import { Address, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import SafeApiKit, { RemoveDelegateProps, DelegateResponse } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'
import { getSafe, PRIVATE_KEY_1 as PRIVATE_KEY } from 'tests/helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: RemoveDelegateProps['signer']
let delegatorAddress: Address

const sortByDelegate = (a: DelegateResponse, b: DelegateResponse) =>
  a.delegate.toLowerCase() > b.delegate.toLowerCase() ? -1 : 1

describe('getSafeDelegates', () => {
  const safeAddress = getSafe().address

  before(() => {
    safeApiKit = getApiKit()
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY)
    })
    delegatorAddress = signer.account.address
  })

  it('should fail if no address is provided', async () => {
    await chai
      .expect(safeApiKit.queue.getDelegates({ safeAddress: '' }))
      .to.be.rejectedWith(
        'At least one of safeAddress, delegateAddress or delegatorAddress is required'
      )
  })

  it('should return an empty array if the Safe address is not found', async () => {
    const safeAddress = '0x11dBF28A2B46bdD4E284e79e28B2E8b94Cfa39Bc'
    const safeDelegateListResponse = await safeApiKit.queue.getDelegates({ safeAddress })
    const results = safeDelegateListResponse.results
    chai.expect(results).to.be.empty
  })

  describe('for valid parameters', () => {
    let delegateConfig1: RemoveDelegateProps
    let delegateConfig2: RemoveDelegateProps
    let delegatesResponse: DelegateResponse[]

    before(async () => {
      delegateConfig1 = {
        safeAddress,
        delegateAddress: '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
        delegatorAddress,
        signer
      }
      delegateConfig2 = {
        safeAddress,
        delegateAddress: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        delegatorAddress,
        signer
      }

      await safeApiKit.queue.addDelegate({ label: 'Label1', ...delegateConfig1 })
      await safeApiKit.queue.addDelegate({ label: 'Label2', ...delegateConfig2 })
    })

    after(async () => {
      await safeApiKit.queue.removeDelegate(delegateConfig1)
      await safeApiKit.queue.removeDelegate(delegateConfig2)
    })

    it('should return an array of delegates', async () => {
      const { results, count } = await safeApiKit.queue.getDelegates({ safeAddress })
      delegatesResponse = [...results]
      results.sort(sortByDelegate)
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(2)
      chai.expect(results[0].safe?.toLowerCase()).to.be.eq(safeAddress.toLowerCase())
      chai
        .expect(results[0].delegate.toLowerCase())
        .to.be.eq(delegateConfig1.delegateAddress.toLowerCase())
      chai.expect(results[0].delegator.toLowerCase()).to.be.eq(delegatorAddress.toLowerCase())
      chai.expect(results[0].chainId).to.be.eq(config.CHAIN_ID.toString())
      chai.expect(results[0].label).to.be.eq('Label1')
      chai.expect(results[1].safe?.toLowerCase()).to.be.eq(safeAddress.toLowerCase())
      chai
        .expect(results[1].delegate.toLowerCase())
        .to.be.eq(delegateConfig2.delegateAddress.toLowerCase())
      chai.expect(results[1].delegator.toLowerCase()).to.be.eq(delegatorAddress.toLowerCase())
      chai.expect(results[1].label).to.be.eq('Label2')
    })

    it('should filter the delegates by label', async () => {
      const { results, count } = await safeApiKit.queue.getDelegates({
        safeAddress,
        label: 'Label2'
      })
      chai.expect(count).to.be.eq(1)
      chai.expect(results[0].label).to.be.eq('Label2')
    })

    it('should return only the first delegate with limit = 1', async () => {
      const { results, count } = await safeApiKit.queue.getDelegates({ safeAddress, limit: 1 })
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(1)
      chai.expect(results).to.be.deep.eq(delegatesResponse.slice(0, 1))
    })

    it('should return only the second delegate with offset = 1', async () => {
      const { results, count } = await safeApiKit.queue.getDelegates({ safeAddress, offset: 1 })
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(1)
      chai.expect(results).to.be.deep.eq(delegatesResponse.slice(1))
    })
  })

  it('should return an array of delegates EIP-3770', async () => {
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateConfig1: RemoveDelegateProps = {
      safeAddress: eip3770SafeAddress,
      delegateAddress: `${config.EIP_3770_PREFIX}:0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B`,
      delegatorAddress,
      signer
    }
    const delegateConfig2: RemoveDelegateProps = {
      safeAddress: eip3770SafeAddress,
      delegateAddress: `${config.EIP_3770_PREFIX}:0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`,
      delegatorAddress,
      signer
    }
    await safeApiKit.queue.addDelegate({ label: 'Label1', ...delegateConfig1 })
    await safeApiKit.queue.addDelegate({ label: 'Label2', ...delegateConfig2 })
    const safeDelegateListResponse = await safeApiKit.queue.getDelegates({
      safeAddress: eip3770SafeAddress
    })
    const { results } = safeDelegateListResponse
    results.sort(sortByDelegate)
    chai.expect(results.length).to.be.eq(2)
    chai
      .expect(results[0].delegate.toLowerCase())
      .to.be.eq('0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'.toLowerCase())
    chai.expect(results[0].delegator.toLowerCase()).to.be.eq(delegatorAddress.toLowerCase())
    chai.expect(results[0].label).to.be.eq('Label1')
    chai
      .expect(results[1].delegate.toLowerCase())
      .to.be.eq('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'.toLowerCase())
    chai.expect(results[1].delegator.toLowerCase()).to.be.eq(delegatorAddress.toLowerCase())
    chai.expect(results[1].label).to.be.eq('Label2')
    await safeApiKit.queue.removeDelegate(delegateConfig1)
    await safeApiKit.queue.removeDelegate(delegateConfig2)
  })
})
