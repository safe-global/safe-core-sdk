import { Signer } from '@ethersproject/abstract-signer'
import SafeApiKit, { DeleteSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: Signer

describe('getSafeDelegates', () => {
  before(async () => {
    ;({ safeApiKit, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeDelegates({ safeAddress }))
      .to.be.rejectedWith('Bad Request')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
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
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegatorAddress = await signer.getAddress()
    const delegateConfig1: DeleteSafeDelegateProps = {
      delegateAddress: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
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
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegatorAddress = await signer.getAddress()
    const delegateConfig1: DeleteSafeDelegateProps = {
      delegateAddress: `${config.EIP_3770_PREFIX}:0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0`,
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
    chai.expect(sortedResults[0].delegate).to.be.eq('0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0')
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
