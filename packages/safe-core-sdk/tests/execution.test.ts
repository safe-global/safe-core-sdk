import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { GnosisSafe } from '../typechain'
import { getMultiSend, getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  contractNetworks: ContractNetworksConfig
}

describe('Transactions execution', () => {
  const [user1, user2, user3, user4] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address, user2.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, contractNetworks }
    }
  )

  describe('executeTransaction', async () => {
    it('should fail if a provider is provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1.provider,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction([
        {
          to: safe.address,
          value: '0',
          data: '0x'
        }
      ])
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
      const tx = await safeSdk1.createTransaction([
        {
          to: mainnetGnosisDAOSafe,
          value: '0',
          data: '0x'
        }
      ])
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({ providerOrSigner: user2, contractNetworks })
      const tx = await safeSdk1.createTransaction([
        {
          to: safe.address,
          value: '0',
          data: '0x'
        }
      ])
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse = await safeSdk2.approveTransactionHash(txHash)
      await txResponse.wait()
      await chai
        .expect(safeSdk2.executeTransaction(tx))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction([
        {
          to: safe.address,
          value: '0',
          data: '0x'
        }
      ])
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute a transaction with threshold 1', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction([
        {
          to: user2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
      ])
      const txResponse = await safeSdk1.executeTransaction(tx)
      await txResponse.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })

    it('should execute a transaction with threshold >1', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({ providerOrSigner: user2, contractNetworks })
      const safeSdk3 = await safeSdk1.connect({ providerOrSigner: user3, contractNetworks })
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction([
        {
          to: user2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
      ])
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
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({ providerOrSigner: user2, contractNetworks })
      const safeSdk3 = await safeSdk1.connect({ providerOrSigner: user3, contractNetworks })
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction([
        {
          to: user2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
      ])
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
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({ providerOrSigner: user2, contractNetworks })
      const safeSdk3 = await safeSdk1.connect({ providerOrSigner: user3, contractNetworks })
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('2000000000000000000') // 2 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const txs = [
        {
          to: user2.address,
          value: '1100000000000000000', // 1.1 ETH
          data: '0x'
        },
        {
          to: user2.address,
          value: '100000000000000000', // 0.1 ETH
          data: '0x'
        }
      ]
      const multiSendTx = await safeSdk1.createTransaction(txs)
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
  })
})
