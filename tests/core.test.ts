import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber, Signer } from 'ethers'
import { deployments, ethers, waffle, Web3 } from 'hardhat'
import EthersSafe from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()

    const web3 = new Web3('http://localhost:8545')
    const accounts = await web3.eth.getAccounts()
    console.log({accounts})
    
    const provider = new ethers.providers.Web3Provider(web3.currentProvider as any)
    const signer1: Signer = provider.getSigner(0)
    const signer2: Signer = provider.getSigner(1)
    const signer3: Signer = provider.getSigner(2)
    
    return {
      safe: await getSafeWithOwners([await signer1.getAddress(), await signer2.getAddress(), await signer3.getAddress()]),
      chainId: (await waffle.provider.getNetwork()).chainId,
      signer1: signer1,
      signer2: signer2,
      signer3: signer3
    }
  })

  describe('tests', async () => {
    it('test', async () => {
      const { safe, signer1, signer2, signer3 } = await setupTests()

      console.log('safe address', safe.address)
      await signer1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('2000000000000000000')
      })
  
      const safeSdk = await EthersSafe.create(ethers, safe.address, signer1)
      console.log('owners', await safeSdk.getOwners())
      console.log('safe balance before tx', (await safeSdk.getBalance()).toString())
      
      const tx = await safeSdk.createTransaction({
        to: await signer2.getAddress(),
        value: '1000000000000000000',
        data: '0x',
      })
      
      await safeSdk.signTransaction(tx)
  
      const safeSdk2 = await safeSdk.connect(signer2)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
  
      const safeSdk3 = await safeSdk2.connect(signer3)
      const txResponse2 = await safeSdk3.executeTransaction(tx)
      await txResponse2.wait()
  
      console.log('safe balance after tx', (await safeSdk.getBalance()).toString())
    })
  })
})
