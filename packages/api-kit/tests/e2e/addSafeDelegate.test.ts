import { Signer } from '@ethersproject/abstract-signer'
import SafeApiKit, { AddSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: Signer

describe('addSafeDelegate', () => {
  before(async () => {
    ;({ safeApiKit, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Label is empty', async () => {
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
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
    const delegateAddress = ''
    const delegatorAddress = await signer.getAddress()
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe delegator address is empty', async () => {
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = ''
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegator address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${safeAddress} is not checksumed`)
  })

  it('should fail if Safe delegate address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'.toLowerCase()
    const delegatorAddress = await signer.getAddress()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegateAddress} is not checksumed`)
  })

  it('should fail if Safe delegator address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = (await signer.getAddress()).toLowerCase()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegatorAddress} is not checksumed`)
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const { safeApiKit, signer } = await getServiceClient(
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
    )
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(
        `Provided delegator=${delegatorAddress} is not an owner of Safe=${safeAddress}`
      )
  })

  it('should add a new delegate', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
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
    chai.expect(delegateResponse.safe).to.be.equal(delegateConfig.safeAddress)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateConfig.delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegateConfig.delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({ safeAddress })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate without specifying a Safe', async () => {
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegatorAddress = await signer.getAddress()
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
    chai.expect(delegateResponse.delegate).to.be.equal(delegateConfig.delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegateConfig.delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const delegatorAddress = await signer.getAddress()
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
    chai.expect(delegateResponse.safe).to.be.equal(safeAddress)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })
})
