import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeDelegateConfig } from '../../src'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient
let signer: Signer

describe('addSafeDelegate', () => {
  before(async () => {
    ;({ serviceSdk, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe delegate address is empty', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const delegateAddress = ''
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should fail if Safe delegate address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'.toLowerCase()
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegateAddress} is not checksumed`)
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const { serviceSdk, signer } = await getServiceClient(
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
    )
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(serviceSdk.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Signing owner is not an owner of the Safe')
  })

  it('should add a new delegate', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const delegateAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    const delegateConfig: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: delegateAddress,
      signer,
      label: 'Label'
    }

    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(initialDelegates.length).to.be.eq(0)

    const delegateResponse = await serviceSdk.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe).to.be.equal(delegateConfig.safe)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateConfig.delegate)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)

    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(finalDelegates.length).to.be.eq(1)
    await serviceSdk.removeSafeDelegate(delegateConfig)
  })
})
