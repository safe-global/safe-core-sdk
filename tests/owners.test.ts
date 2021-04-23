import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { SENTINEL_ADDRESS, zeroAddress } from '../src/utils/constants'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Owners', () => {
  const [user1, user2, user3, user4] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address, user3.address], 3)
    }
  })

  describe('getOwners', async () => {
    it('should return the list of Safe owners', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(2)
      chai.expect(owners[0]).to.be.eq(user1.address)
      chai.expect(owners[1]).to.be.eq(user2.address)
    })
  })

  describe('isOwner', async () => {
    it('should return true if an account is an owner of the connected Safe', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const isOwner = await safeSdk.isOwner(user1.address)
      chai.expect(isOwner).to.be.true
    })

    it('should return false if an account is not an owner of the connected Safe', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const isOwner = await safeSdk.isOwner(user2.address)
      chai.expect(isOwner).to.be.false
    })
  })

  describe('getAddOwnerTx', async () => {
    it('should fail if address is invalid', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getAddOwnerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getAddOwnerTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getAddOwnerTx(zeroAddress)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is already an owner', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getAddOwnerTx(user1.address)
      await chai.expect(tx).to.be.rejectedWith('Address provided is already an owner')
    })

    it('should fail if the threshold is bigger than the number of owners', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const newThreshold = 3
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners)
      const tx = safeSdk.getAddOwnerTx(user2.address, newThreshold)
      await chai.expect(tx).to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getAddOwnerTx(user2.address, 0)
      await chai.expect(tx).to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should add an owner and keep the same threshold', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const initialThreshold = await safeSdk.getThreshold()
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      const tx = await safeSdk.getAddOwnerTx(user2.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(user2.address)
      chai.expect(owners[1]).to.be.eq(user1.address)
    })

    it('should add an owner and update the threshold', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const newThreshold = 1
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      const tx = await safeSdk.getAddOwnerTx(user2.address, newThreshold)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      chai.expect(await safeSdk.getThreshold()).to.be.eq(newThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(2)
      chai.expect(owners[0]).to.be.eq(user2.address)
      chai.expect(owners[1]).to.be.eq(user1.address)
    })
  })

  describe('getRemoveOwnerTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getRemoveOwnerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getRemoveOwnerTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getRemoveOwnerTx(zeroAddress)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is not an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getRemoveOwnerTx(user4.address)
      await chai.expect(tx).to.be.rejectedWith('Address provided is not an owner')
    })

    it('should fail if the threshold is bigger than the number of owners', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const newThreshold = 3
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners - 1)
      const tx = safeSdk.getRemoveOwnerTx(user1.address, newThreshold)
      await chai.expect(tx).to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getRemoveOwnerTx(user1.address, 0)
      await chai.expect(tx).to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should remove the first owner of a Safe and decrease the threshold', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const initialThreshold = await safeSdk1.getThreshold()
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      chai.expect(initialOwners[1]).to.be.eq(user2.address)
      chai.expect(initialOwners[2]).to.be.eq(user3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(user1.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      const finalThreshold = await safeSdk1.getThreshold()
      chai.expect(initialThreshold - 1).to.be.eq(finalThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(user2.address)
      chai.expect(finalOwners[1]).to.be.eq(user3.address)
    })

    it('should remove any owner of a Safe and decrease the threshold', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const initialThreshold = await safeSdk1.getThreshold()
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      chai.expect(initialOwners[1]).to.be.eq(user2.address)
      chai.expect(initialOwners[2]).to.be.eq(user3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(user2.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      const finalThreshold = await safeSdk1.getThreshold()
      chai.expect(initialThreshold - 1).to.be.eq(finalThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(user1.address)
      chai.expect(finalOwners[1]).to.be.eq(user3.address)
    })

    it('should remove an owner and update the threshold', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const newThreshold = 1
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      chai.expect(initialOwners[1]).to.be.eq(user2.address)
      chai.expect(initialOwners[2]).to.be.eq(user3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(user1.address, newThreshold)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      chai.expect(await safeSdk1.getThreshold()).to.be.eq(newThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(user2.address)
      chai.expect(finalOwners[1]).to.be.eq(user3.address)
    })
  })

  describe('getSwapOwnerTx', async () => {
    it('should fail if old address is invalid', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx('0x123', user2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is invalid', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(user1.address, '0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is equal to sentinel', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(SENTINEL_ADDRESS, user2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is equal to sentinel', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(user1.address, SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is equal to 0x address', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(zeroAddress, user2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is equal to 0x address', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(user1.address, zeroAddress)
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is not an owner', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(user4.address, user2.address)
      await chai.expect(tx).to.be.rejectedWith('Old address provided is not an owner')
    })

    it('should fail if new address is already an owner', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = safeSdk.getSwapOwnerTx(user1.address, user1.address)
      await chai.expect(tx).to.be.rejectedWith('New address provided is already an owner')
    })

    it('should replace the first owner of a Safe', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      const tx = await safeSdk.getSwapOwnerTx(user1.address, user2.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      const finalOwners = await safeSdk.getOwners()
      chai.expect(finalOwners.length).to.be.eq(1)
      chai.expect(finalOwners[0]).to.be.eq(user2.address)
    })

    it('should replace any owner of a Safe', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(user1.address)
      chai.expect(initialOwners[1]).to.be.eq(user2.address)
      chai.expect(initialOwners[2]).to.be.eq(user3.address)
      const tx = await safeSdk1.getSwapOwnerTx(user2.address, user4.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(3)
      chai.expect(finalOwners[0]).to.be.eq(user1.address)
      chai.expect(finalOwners[1]).to.be.eq(user4.address)
      chai.expect(finalOwners[2]).to.be.eq(user3.address)
    })
  })
})
