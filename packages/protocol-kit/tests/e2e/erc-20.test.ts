import Safe, {
  createERC20TokenTransferTransaction,
  getERC20Decimals,
  isGasTokenCompatibleWithHandlePayment
} from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { deployments, waffle } from 'hardhat'

import { itif } from './utils/helpers'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getAccounts } from './utils/setupTestNetwork'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const ERC20_TOKEN_ADDRESS = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'

describe('ERC-20 utils', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)

    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      contractNetworks,
      accounts
    }
  })

  describe('getERC20Decimals', () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return the correct decimals for a standard ERC20 token',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        // mock decimals() call
        sinon.stub(ethAdapter, 'call').returns(Promise.resolve('0x12'))

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const decimals = await getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk)

        chai.expect(decimals).to.be.equal(18) // standard 18 decimals like DAI token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the correct decimals for a non-standard ERC20 token',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        // mock decimals() call
        sinon.stub(ethAdapter, 'call').returns(Promise.resolve('0x06'))

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const decimals = await getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk)

        chai.expect(decimals).to.be.equal(6) // non-standard decimals like USDC token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should throw an error if decimals() fn is not defined',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        // mock decimals() call
        sinon.stub(ethAdapter, 'call').returns(Promise.resolve('0x'))

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        await chai
          .expect(getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk))
          .to.be.rejectedWith('Invalid ERC-20 decimals')
      }
    )
  })

  describe('isGasTokenCompatibleWithHandlePayment', () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return true if it is the Native token',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ZERO_ADDRESS, // native token
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(true)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return true if it is an standard ERC20 token',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        // mock decimals() call
        sinon.stub(ethAdapter, 'call').returns(Promise.resolve('0x12'))

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ERC20_TOKEN_ADDRESS,
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(true) // compatible ERC-20 like DAI token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return false for a non-standard ERC20 token',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()

        const [account1] = accounts

        const ethAdapter = await getEthAdapter(account1.signer)

        // mock decimals() call
        sinon.stub(ethAdapter, 'call').returns(Promise.resolve('0x06'))

        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ERC20_TOKEN_ADDRESS,
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(false) // non-compatible ERC-20 like USDC token
      }
    )
  })

  describe('createERC20TokenTransferTransaction', () => {
    itif(safeVersionDeployed >= '1.3.0')('creates a transaction transfer object', async () => {
      const toAddress = '0xbc2BB26a6d821e69A38016f3858561a1D80d4182'
      const amount = '12345'

      const transfer = await createERC20TokenTransferTransaction(
        ERC20_TOKEN_ADDRESS,
        toAddress,
        amount
      )

      chai.expect(transfer).to.be.deep.equal({
        to: ERC20_TOKEN_ADDRESS,
        value: '0',
        // transfer encoded
        data: '0xa9059cbb000000000000000000000000bc2bb26a6d821e69a38016f3858561a1d80d41820000000000000000000000000000000000000000000000000000000000003039'
      })
    })
  })
})
