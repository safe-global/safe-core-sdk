import { createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import SafeApiKit, { DeleteSafeDelegateProps } from '@safe-global/api-kit/index'
import { Address, Eip3770Address } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

const PRIVATE_KEY = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

let safeApiKit: SafeApiKit
let signer: DeleteSafeDelegateProps['signer']
let delegatorAddress: Address

describe('removeSafeDelegate', () => {
  before(() => {
    safeApiKit = getApiKit('https://safe-transaction-sepolia.staging.5afe.dev/api')
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY)
    })
    delegatorAddress = signer.account.address
  })

  it('should fail if Safe delegate address is empty', async () => {
    const delegateAddress = '' as Address
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer
    }
    await chai
      .expect(safeApiKit.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe delegator address is empty', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegatorAddress = '' as Address
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer
    }
    await chai
      .expect(safeApiKit.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegator address')
  })

  it('should fail if Safe delegate address is not checksummed', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'.toLowerCase() as Address
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer
    }
    await chai
      .expect(safeApiKit.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Checksum address validation failed`)
  })

  it('should fail if Safe delegator address is not checksummed', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegatorAddressLowerCase = delegatorAddress.toLowerCase() as Address
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress: delegatorAddressLowerCase,
      signer
    }
    await chai
      .expect(safeApiKit.removeSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegatorAddressLowerCase} is not checksumed`)
  })

  it('should fail if the delegate to remove is not a delegate', async () => {
    const delegateAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer
    }
    await chai.expect(safeApiKit.removeSafeDelegate(delegateConfig)).to.be.rejectedWith('Not Found')
  })

  it('should remove a delegate', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer
    }
    await safeApiKit.addSafeDelegate({ ...delegateConfig, label: 'Label' })
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(0)
  })

  it('should remove a delegate EIP-3770', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const eip3770DelegateAddress: Eip3770Address = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const eip3770DelegatorAddress: Eip3770Address = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    const delegateConfig: DeleteSafeDelegateProps = {
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress,
      signer
    }
    await safeApiKit.addSafeDelegate({ ...delegateConfig, label: 'Label' })
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(0)
  })
})
