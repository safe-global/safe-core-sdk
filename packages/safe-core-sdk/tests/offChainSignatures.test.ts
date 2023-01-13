import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { safeVersionDeployed } from '../hardhat/deploy/deploy-contracts'
import Safe from '../src'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Off-chain signatures', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('signTransactionHash', async () => {
    it('should sign a transaction hash with the current signer', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      const txHash = await safeSdk.getTransactionHash(tx)
      const signature = await safeSdk.signTransactionHash(txHash)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })
  })

  describe('signTransaction', async () => {
    it('should fail if the signature is added by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const ethAdapter = await getEthAdapter(account3.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      await chai
        .expect(safeSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })

    it('should ignore duplicated signatures', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx1 = await safeSdk.signTransaction(tx)
      chai.expect(signedTx1.signatures.size).to.be.eq(1)
      const signedTx2 = await safeSdk.signTransaction(signedTx1)
      chai.expect(signedTx2.signatures.size).to.be.eq(1)
      chai.expect(tx.signatures.size).to.be.eq(0)
    })

    itif(safeVersionDeployed === '1.0.0')(
      'should fail if the signature of the current signer is added using eth_sign and safeVersion===1.0.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        await chai
          .expect(safeSdk.signTransaction(tx, 'eth_sign'))
          .to.be.rejectedWith('eth_sign is only supported by Safes >= v1.1.0')
      }
    )

    itif(safeVersionDeployed > '1.0.0')(
      'should add the signature of the current signer using eth_sign if safeVersion>1.0.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        chai.expect(tx.signatures.size).to.be.eq(0)
        const signedTx = await safeSdk.signTransaction(tx, 'eth_sign')
        chai.expect(tx.signatures.size).to.be.eq(0)
        chai.expect(signedTx.signatures.size).to.be.eq(1)
      }
    )

    itif(process.env.ETH_LIB === 'ethers')(
      'should add the signature of the current signer using eth_signTypedData with ethers provider',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        chai.expect(tx.signatures.size).to.be.eq(0)
        const signedTx = await safeSdk.signTransaction(tx, 'eth_signTypedData')
        chai.expect(tx.signatures.size).to.be.eq(0)
        chai.expect(signedTx.signatures.size).to.be.eq(1)
      }
    )

    itif(process.env.ETH_LIB === 'web3')(
      'should fail if the signature of the current signer is added using eth_signTypedData with web3 provider',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        await chai
          .expect(safeSdk.signTransaction(tx, 'eth_signTypedData'))
          .to.be.rejectedWith("EIP-712 is not supported by user's wallet")
      }
    )

    itif(process.env.ETH_LIB === 'ethers')(
      'should add the signature of the current signer using eth_signTypedData_v3 with ethers provider',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        chai.expect(tx.signatures.size).to.be.eq(0)
        const signedTx = await safeSdk.signTransaction(tx, 'eth_signTypedData_v3')
        chai.expect(tx.signatures.size).to.be.eq(0)
        chai.expect(signedTx.signatures.size).to.be.eq(1)
      }
    )

    itif(process.env.ETH_LIB === 'web3')(
      'should fail if the signature of the current signer is added using eth_signTypedData_v3 with web3 provider',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const safeTransactionData: SafeTransactionDataPartial = {
          to: safe.address,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ safeTransactionData })
        await chai
          .expect(safeSdk.signTransaction(tx, 'eth_signTypedData_v3'))
          .to.be.rejectedWith("EIP-712 is not supported by user's wallet")
      }
    )

    it('should add the signature of the current signer using eth_signTypedData_v4', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx, 'eth_signTypedData_v4')
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should add the signature of the current signer using eth_signTypedData_v4 by default', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })
  })
})
