import { MetaTransactionData, SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe, { ContractNetworksConfig, SafeTransactionOptionalProps } from '../src'
import {
  getERC20Mintable,
  getFactory,
  getMultiSend,
  getSafeSingleton,
  getSafeWithOwners
} from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Transactions creation', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: {
        multiSendAddress: (await getMultiSend()).address,
        safeMasterCopyAddress: (await getSafeSingleton()).address,
        safeProxyFactoryAddress: (await getFactory()).address
      }
    }
    return {
      erc20Mintable: await getERC20Mintable(),
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      chainId,
      contractNetworks
    }
  })

  describe('createTransaction', async () => {
    it('should create a single transaction', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const txDataPartial: SafeTransactionDataPartial = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x',
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const tx = await safeSdk.createTransaction(txDataPartial)
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(111)
      chai.expect(tx.data.gasPrice).to.be.eq(222)
      chai.expect(tx.data.gasToken).to.be.eq('0x333')
      chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx.data.nonce).to.be.eq(555)
      chai.expect(tx.data.safeTxGas).to.be.eq(666)
    })

    it('should create a single transaction when passing a transaction array with length=1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const metaTransactions: MetaTransactionData[] = [
        {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
      ]
      const tx = await safeSdk.createTransaction(metaTransactions)
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
    })

    it('should create a single transaction when passing a transaction array with length=1 and options', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const metaTransactions: MetaTransactionData[] = [
        {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
      ]
      const options: SafeTransactionOptionalProps = {
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const tx = await safeSdk.createTransaction(metaTransactions, options)
      chai.expect(tx.data.to).to.be.eq(account2.address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(111)
      chai.expect(tx.data.gasPrice).to.be.eq(222)
      chai.expect(tx.data.gasToken).to.be.eq('0x333')
      chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx.data.nonce).to.be.eq(555)
      chai.expect(tx.data.safeTxGas).to.be.eq(666)
    })

    it('should fail when creating a MultiSend transaction passing a transaction array with length=0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const txs: MetaTransactionData[] = []
      const tx = safeSdk.createTransaction(txs)
      await chai.expect(tx).to.be.rejectedWith('Invalid empty array of transactions')
    })

    it('should create a MultiSend transaction', async () => {
      const { accounts, contractNetworks, erc20Mintable, chainId } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const txs: MetaTransactionData[] = [
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ERC20
          ])
        },
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ERC20
          ])
        }
      ]
      const multiSendTx = await safeSdk.createTransaction(txs)
      chai.expect(multiSendTx.data.to).to.be.eq(contractNetworks[chainId].multiSendAddress)
    })

    it('should create a MultiSend transaction with options', async () => {
      const { accounts, contractNetworks, erc20Mintable, chainId } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const options: SafeTransactionOptionalProps = {
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const txs: MetaTransactionData[] = [
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ERC20
          ])
        },
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ERC20
          ])
        }
      ]
      const multiSendTx = await safeSdk.createTransaction(txs, options)
      chai.expect(multiSendTx.data.to).to.be.eq(contractNetworks[chainId].multiSendAddress)
      chai.expect(multiSendTx.data.value).to.be.eq('0')
      chai.expect(multiSendTx.data.baseGas).to.be.eq(111)
      chai.expect(multiSendTx.data.gasPrice).to.be.eq(222)
      chai.expect(multiSendTx.data.gasToken).to.be.eq('0x333')
      chai.expect(multiSendTx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(multiSendTx.data.nonce).to.be.eq(555)
      chai.expect(multiSendTx.data.safeTxGas).to.be.eq(666)
    })
  })
})
