import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import { safeVersionDeployed } from '@safe-global/testing-kit'
import Safe, { PredictedSafeProps, SafeFactory } from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { waitTransactionReceipt } from './utils/transactions'
import { sameString } from '@safe-global/protocol-kit/utils'

chai.use(chaiAsPromised)

describe('Safe Info', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [accounts[0].address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }
    const provider = getEip1193Provider()
    return {
      chainId,
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      provider,
      predictedSafe,
      accounts,
      contractNetworks
    }
  })

  describe('connect', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail to connect a Safe <v1.3.0 that is not deployed',
      async () => {
        const { predictedSafe, safe, contractNetworks, provider } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeSdk2 = safeSdk.connect({ predictedSafe })
        chai
          .expect(safeSdk2)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    it('should connect a Safe >=v1.3.0 that is not deployed', async () => {
      const { predictedSafe, safe, accounts, contractNetworks, provider } = await setupTests()
      const [account1] = accounts
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeSdk2 = await safeSdk.connect({ predictedSafe })
      chai.expect(
        sameString(
          await safeSdk2.getSafeProvider().getSignerAddress(),
          await account1.signer.account?.address
        )
      ).to.be.true
    })

    it('should connect a deployed Safe', async () => {
      const { safe, accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2, account3] = accounts
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.getAddress()).to.be.eq(safeAddress)

      chai.expect(
        sameString(
          await safeSdk.getSafeProvider().getSignerAddress(),
          await account1.signer.account?.address
        )
      ).to.be.true

      const safeSdk2 = await safeSdk.connect({
        signer: account2.address,
        contractNetworks
      })
      const signer = await safeSdk2.getSafeProvider().getExternalSigner()
      chai.expect(signer)
      chai.expect(await safeSdk2.getAddress()).to.be.eq(safeAddress)
      chai.expect(
        sameString(
          await safeSdk2.getSafeProvider().getSignerAddress(),
          await account2.signer.account?.address
        )
      ).to.be.true

      const safe2 = await getSafeWithOwners([account3.address])
      const safe2Address = safe2.address
      const safeSdk3 = await safeSdk2.connect({
        safeAddress: safe2Address,
        signer: account3.address
      })
      chai.expect(await safeSdk3.getAddress()).to.be.eq(safe2Address)
      chai.expect(
        sameString(
          await safeSdk3.getSafeProvider().getSignerAddress(),
          await account3.signer.account?.address
        )
      ).to.be.true
    })
  })

  describe('getContractVersion', async () => {
    it('should return the contract version of a Safe that is not deployed with a custom version configuration', async () => {
      const { predictedSafe, contractNetworks, provider } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq(safeVersionDeployed)
    })

    it('should return the contract version of a Safe that is not deployed with a default version configuration', async () => {
      const { predictedSafe, contractNetworks, provider } = await setupTests()
      const safeConfig: PredictedSafeProps = {
        ...predictedSafe,
        safeDeploymentConfig: {}
      }
      const safeSdk = await Safe.init({
        provider,
        predictedSafe: safeConfig,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq(DEFAULT_SAFE_VERSION)
    })

    it('should return the Safe contract version', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq(safeVersionDeployed)
    })
  })

  describe('getAddress', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail to return the address of a Safe <v1.3.0 that is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const getSafeAaddress = safeSdk.getAddress()
        chai
          .expect(getSafeAaddress)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the address of a Safe >=v1.3.0 that is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const safeAddress = await safeSdk.getAddress()

        const safeFactory = await SafeFactory.init({
          provider,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })
        const deployedSdk = await safeFactory.deploySafe(predictedSafe)
        const expectedSafeAddress = await deployedSdk.getAddress()

        chai.expect(safeAddress).to.be.eq(expectedSafeAddress)
      }
    )

    it('should return the address of a deployed Safe', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.getAddress()).to.be.eq(safeAddress)
    })
  })

  describe('getEip1193Provider', async () => {
    it('should return the connected SafeProvider', async () => {
      const { safe, accounts, contractNetworks, provider } = await setupTests()
      const [account1] = accounts
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safeAddress,
        contractNetworks
      })

      chai.expect(
        sameString(
          await safeSdk.getSafeProvider().getSignerAddress(),
          await account1.signer.account?.address
        )
      ).to.be.true
    })
  })

  describe('getNonce', async () => {
    it('should return the nonce of a Safe that is not deployed', async () => {
      const { predictedSafe, contractNetworks, provider } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai.expect(await safeSdk.getNonce()).to.be.eq(0)
    })

    it('should return the Safe nonce', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.getNonce()).to.be.eq(0)
      const safeTransactionData = {
        to: account2.address,
        value: '0',
        data: '0x'
      }

      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getNonce()).to.be.eq(1)
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of a Safe that is not deployed', async () => {
      const { predictedSafe, chainId, contractNetworks, provider } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })

    it('should return the chainId of the current network', async () => {
      const { safe, chainId, contractNetworks, provider } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail to return the balance of a Safe <v1.3.0 that is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        chai
          .expect(safeSdk.getBalance())
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the balance of a Safe >=v1.3.0 that is not deployed',
      async () => {
        const { predictedSafe, accounts, contractNetworks, provider } = await setupTests()
        const [account1] = accounts
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        chai.expect(await safeSdk.getBalance()).to.be.eq(0n)

        const hash = await account1.signer.sendTransaction({
          to: await safeSdk.getAddress(),
          value: BigInt(`${1e18}`)
        })
        await waitTransactionReceipt(hash)

        // TODO: Not working without this delay
        // await new Promise((resolve) => setTimeout(resolve, 500))

        chai.expect(await safeSdk.getBalance()).to.be.eq(BigInt(`${1e18}`))
      }
    )

    it('should return the balance of a deployed Safe', async () => {
      const { safe, accounts, contractNetworks, provider } = await setupTests()
      const [account1] = accounts
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        signer: account1.address,
        safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(0n)

      const txHash = await account1.signer.sendTransaction({
        to: safeAddress,
        value: BigInt(`${1e18}`)
      })
      await waitTransactionReceipt(txHash)

      // TODO: Not working without this delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      chai.expect(await safeSdk.getBalance()).to.be.eq(BigInt(`${1e18}`))
    })
  })
})
