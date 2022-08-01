import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeDelegateConfig } from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient
let signer: Signer

describe('removeAllSafeDelegates', () => {
  before(async () => {
    ;({ serviceSdk, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const { serviceSdk, signer } = await getServiceClient(
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
    )
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Signing owner is not an owner of the Safe')
  })

  it('should remove all delegates', async () => {
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
    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(initialDelegates.length).to.be.eq(2)
    await serviceSdk.removeAllSafeDelegates(safeAddress, signer)
    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(finalDelegates.length).to.be.eq(0)
  })

  it('should remove all delegates EIP-3770', async () => {
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
    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(eip3770SafeAddress)
    chai.expect(initialDelegates.length).to.be.eq(2)
    await serviceSdk.removeAllSafeDelegates(eip3770SafeAddress, signer)
    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(eip3770SafeAddress)
    chai.expect(finalDelegates.length).to.be.eq(0)
  })
})
