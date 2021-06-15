import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { SafeTransactionDataPartial } from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { getAccounts } from './utils/setupConfig'
import { getERC20Mintable, getMultiSend, getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('Transactions execution', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      erc20Mintable: await getERC20Mintable(),
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('executeTransaction', async () => {
    it('should fail if a provider is provided', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer.provider,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if no provider or signer is provided', async () => {
      const { contractNetworks } = await setupTests()
      const mainnetGnosisDAOSafe = '0x0da0c3e52c977ed3cbc641ff02dd271c3ed55afe'
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: mainnetGnosisDAOSafe,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: mainnetGnosisDAOSafe,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse = await safeSdk2.approveTransactionHash(txHash)
      await txResponse.wait()
      await chai
        .expect(safeSdk2.executeTransaction(tx))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should fail if the user tries to execute a transaction that was rejected', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      })
      const rejectTx = await safeSdk1.createRejectionTransaction(tx.data.nonce)
      await safeSdk1.signTransaction(rejectTx)
      const txRejectResponse = await safeSdk2.executeTransaction(rejectTx)
      await txRejectResponse.wait()
      await safeSdk1.signTransaction(tx)
      await chai
        .expect(safeSdk2.executeTransaction(tx))
        .to.be.rejectedWith('Invalid owner provided')
    })

    it('should execute a transaction with threshold 1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      })
      const txResponse = await safeSdk1.executeTransaction(tx)
      await txResponse.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })

    it('should execute a transaction with threshold >1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const safeSdk3 = await safeSdk1.connect({
        providerOrSigner: account3.signer,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(tx)
      await txResponse2.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const safeSdk3 = await safeSdk1.connect({
        providerOrSigner: account3.signer,
        contractNetworks
      })
      await account2.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(tx)
      await txResponse2.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })
  })

  describe('executeTransaction (MultiSend)', async () => {
    it('should execute a batch transaction with threshold >1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const safeSdk3 = await safeSdk1.connect({
        providerOrSigner: account3.signer,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('2000000000000000000') // 2 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const txs: SafeTransactionDataPartial[] = [
        {
          to: account2.address,
          value: '1100000000000000000', // 1.1 ETH
          data: '0x'
        },
        {
          to: account2.address,
          value: '100000000000000000', // 0.1 ETH
          data: '0x'
        }
      ]
      const multiSendTx = await safeSdk1.createTransaction(...txs)
      await safeSdk1.signTransaction(multiSendTx)
      const txHash = await safeSdk2.getTransactionHash(multiSendTx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(multiSendTx)
      await txResponse2.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(
          safeFinalBalance
            .add(BigNumber.from(txs[0].value))
            .add(BigNumber.from(txs[1].value))
            .toString()
        )
    })

    it('should execute a batch transaction with contract calls and threshold >1', async () => {
      const { accounts, contractNetworks, erc20Mintable } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const safeSdk3 = await safeSdk1.connect({
        providerOrSigner: account3.signer,
        contractNetworks
      })

      await erc20Mintable.mint(safe.address, '1200000000000000000') // 1.2 ETH
      const safeInitialERC20Balance = await erc20Mintable.balanceOf(safe.address)
      chai.expect(safeInitialERC20Balance.toString()).to.be.eq('1200000000000000000') // 1.2 ETH
      const accountInitialERC20Balance = await erc20Mintable.balanceOf(account2.address)
      chai.expect(accountInitialERC20Balance.toString()).to.be.eq('0') // 0 ETH

      const txs: SafeTransactionDataPartial[] = [
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ETH
          ])
        },
        {
          to: erc20Mintable.address,
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ETH
          ])
        }
      ]
      const multiSendTx = await safeSdk1.createTransaction(...txs)
      await safeSdk1.signTransaction(multiSendTx)
      const txHash = await safeSdk2.getTransactionHash(multiSendTx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(multiSendTx)
      await txResponse2.wait()

      const safeFinalERC20Balance = await erc20Mintable.balanceOf(safe.address)
      chai.expect(safeFinalERC20Balance.toString()).to.be.eq('0') // 0 ETH
      const accountFinalERC20Balance = await erc20Mintable.balanceOf(account2.address)
      chai.expect(accountFinalERC20Balance.toString()).to.be.eq('1200000000000000000') // 1.2 ETH
    })
  })
})
