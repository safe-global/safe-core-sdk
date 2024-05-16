import { ethers, Signer } from 'ethers'
import SafeApiKit, { DeleteSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

const PRIVATE_KEY = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

let safeApiKit: SafeApiKit
let signer: Signer

describe('getSafeDelegates', () => {
  before(async () => {
    safeApiKit = getApiKit('https://safe-transaction-sepolia.staging.5afe.dev/api')
    signer = new ethers.Wallet(PRIVATE_KEY)
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeDelegates({ safeAddress }))
      .to.be.rejectedWith('Bad Request')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'.toLowerCase()
    await chai
      .expect(safeApiKit.getSafeDelegates({ safeAddress }))
      .to.be.rejectedWith('Enter a valid checksummed Ethereum Address')
  })

  it('should return an empty array if the Safe address is not found', async () => {
    const safeAddress = '0x11dBF28A2B46bdD4E284e79e28B2E8b94Cfa39Bc'
    const safeDelegateListResponse = await safeApiKit.getSafeDelegates({ safeAddress })
    const results = safeDelegateListResponse.results
    chai.expect(results).to.be.empty
  })

  it('should return an array of delegates', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
    const delegatorAddress = await signer.getAddress()
    const delegateConfig1: DeleteSafeDelegateProps = {
      delegateAddress: '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
      delegatorAddress,
      signer
    }
    const delegateConfig2: DeleteSafeDelegateProps = {
      delegateAddress: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
      delegatorAddress,
      signer
    }
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label1',
      ...delegateConfig1
    })
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label2',
      ...delegateConfig2
    })
    const safeDelegateListResponse = await safeApiKit.getSafeDelegates({ safeAddress })
    const { results } = safeDelegateListResponse
    const sortedResults = results.sort((a, b) => (a.delegate > b.delegate ? -1 : 1))
    chai.expect(sortedResults.length).to.be.eq(2)
    chai.expect(sortedResults[0].safe).to.be.eq(safeAddress)
    chai.expect(sortedResults[0].delegate).to.be.eq(delegateConfig1.delegateAddress)
    chai.expect(sortedResults[0].delegator).to.be.eq(await delegateConfig1.signer.getAddress())
    chai.expect(sortedResults[0].label).to.be.eq('Label1')
    chai.expect(sortedResults[1].safe).to.be.eq(safeAddress)
    chai.expect(sortedResults[1].delegate).to.be.eq(delegateConfig2.delegateAddress)
    chai.expect(sortedResults[1].delegator).to.be.eq(await delegateConfig2.signer.getAddress())
    chai.expect(sortedResults[1].label).to.be.eq('Label2')
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig1.delegateAddress,
      delegatorAddress,
      signer
    })
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig2.delegateAddress,
      delegatorAddress,
      signer
    })
  })

  it('should return an array of delegates EIP-3770', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegatorAddress = await signer.getAddress()
    const delegateConfig1: DeleteSafeDelegateProps = {
      delegateAddress: `${config.EIP_3770_PREFIX}:0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B`,
      delegatorAddress,
      signer
    }
    const delegateConfig2: DeleteSafeDelegateProps = {
      delegateAddress: `${config.EIP_3770_PREFIX}:0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`,
      delegatorAddress,
      signer
    }
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label1',
      ...delegateConfig1
    })
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label2',
      ...delegateConfig2
    })
    const safeDelegateListResponse = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    const { results } = safeDelegateListResponse
    const sortedResults = results.sort((a, b) => (a.delegate > b.delegate ? -1 : 1))
    chai.expect(sortedResults.length).to.be.eq(2)
    chai.expect(sortedResults[0].delegate).to.be.eq('0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B')
    chai.expect(sortedResults[0].delegator).to.be.eq(await delegateConfig1.signer.getAddress())
    chai.expect(sortedResults[0].label).to.be.eq('Label1')
    chai.expect(sortedResults[1].delegate).to.be.eq('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b')
    chai.expect(sortedResults[1].delegator).to.be.eq(await delegateConfig2.signer.getAddress())
    chai.expect(sortedResults[1].label).to.be.eq('Label2')
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig1.delegateAddress,
      delegatorAddress,
      signer
    })
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig2.delegateAddress,
      delegatorAddress,
      signer
    })
  })
})
