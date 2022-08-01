import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeDelegateDeleteConfig } from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient
let signer: Signer

describe('removeSafeDelegate', () => {
  before(async () => {
    ;({ serviceSdk, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe delegate address is empty', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = ''
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should fail if Safe delegate address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'.toLowerCase()
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const { serviceSdk, signer } = await getServiceClient(
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
    )
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai
      .expect(serviceSdk.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Signing owner is not an owner of the Safe')
  })

  it('should fail if the delegate to remove is not a delegate', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await chai.expect(serviceSdk.removeSafeDelegate(delegateConfig)).to.be.rejectedWith('Not found')
  })

  it('should remove a delegate', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer
    }
    await serviceSdk.addSafeDelegate({ ...delegateConfig, label: 'Label' })
    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(initialDelegates.length).to.be.eq(1)
    await serviceSdk.removeSafeDelegate(delegateConfig)
    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(finalDelegates.length).to.be.eq(0)
  })

  it('should remove a delegate EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const delegateConfig: SafeDelegateDeleteConfig = {
      safe: eip3770SafeAddress,
      delegate: eip3770DelegateAddress,
      signer
    }
    await serviceSdk.addSafeDelegate({ ...delegateConfig, label: 'Label' })
    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(eip3770SafeAddress)
    chai.expect(initialDelegates.length).to.be.eq(1)
    await serviceSdk.removeSafeDelegate(delegateConfig)
    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(eip3770SafeAddress)
    chai.expect(finalDelegates.length).to.be.eq(0)
  })
})
