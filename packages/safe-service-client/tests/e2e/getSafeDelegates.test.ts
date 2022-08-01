import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeDelegateConfig } from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient
let signer: Signer

describe('getSafeDelegates', () => {
  before(async () => {
    ;({ serviceSdk, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getSafeDelegates(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(serviceSdk.getSafeDelegates(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty array if the Safe address is not found', async () => {
    const safeAddress = '0x11dBF28A2B46bdD4E284e79e28B2E8b94Cfa39Bc'
    const safeDelegateListResponse = await serviceSdk.getSafeDelegates(safeAddress)
    const results = safeDelegateListResponse.results
    chai.expect(results).to.be.empty
  })

  it('should return an array of delegates', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'

    const delegateConfig1: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
      signer,
      label: 'Label1'
    }
    const delegateConfig2: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
      signer,
      label: 'Label2'
    }
    await serviceSdk.addSafeDelegate(delegateConfig1)
    await serviceSdk.addSafeDelegate(delegateConfig2)
    const safeDelegateListResponse = await serviceSdk.getSafeDelegates(safeAddress)
    const { results } = safeDelegateListResponse
    const sortedResults = results.sort((a, b) => (a.delegate > b.delegate ? -1 : 1))
    chai.expect(sortedResults.length).to.be.eq(2)
    chai.expect(sortedResults[0].delegate).to.be.eq(delegateConfig1.delegate)
    chai.expect(sortedResults[0].delegator).to.be.eq(await delegateConfig1.signer.getAddress())
    chai.expect(sortedResults[0].label).to.be.eq(delegateConfig1.label)
    chai.expect(sortedResults[1].delegate).to.be.eq(delegateConfig2.delegate)
    chai.expect(sortedResults[1].delegator).to.be.eq(await delegateConfig2.signer.getAddress())
    chai.expect(sortedResults[1].label).to.be.eq(delegateConfig2.label)
    await serviceSdk.removeAllSafeDelegates(safeAddress, signer)
  })

  it('should return an array of delegates EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateConfig1: SafeDelegateConfig = {
      safe: eip3770SafeAddress,
      delegate: `${config.EIP_3770_PREFIX}:0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0`,
      signer,
      label: 'Label1'
    }
    const delegateConfig2: SafeDelegateConfig = {
      safe: eip3770SafeAddress,
      delegate: `${config.EIP_3770_PREFIX}:0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`,
      signer,
      label: 'Label2'
    }
    await serviceSdk.addSafeDelegate(delegateConfig1)
    await serviceSdk.addSafeDelegate(delegateConfig2)
    const safeDelegateListResponse = await serviceSdk.getSafeDelegates(eip3770SafeAddress)
    const { results } = safeDelegateListResponse
    const sortedResults = results.sort((a, b) => (a.delegate > b.delegate ? -1 : 1))
    chai.expect(sortedResults.length).to.be.eq(2)
    chai.expect(sortedResults[0].delegate).to.be.eq('0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0')
    chai.expect(sortedResults[0].delegator).to.be.eq(await delegateConfig1.signer.getAddress())
    chai.expect(sortedResults[0].label).to.be.eq(delegateConfig1.label)
    chai.expect(sortedResults[1].delegate).to.be.eq('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b')
    chai.expect(sortedResults[1].delegator).to.be.eq(await delegateConfig2.signer.getAddress())
    chai.expect(sortedResults[1].label).to.be.eq(delegateConfig2.label)
    await serviceSdk.removeAllSafeDelegates(eip3770SafeAddress, signer)
  })
})
