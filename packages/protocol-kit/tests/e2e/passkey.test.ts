import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PasskeySigner, PredictedSafeProps, SafeProvider } from '@safe-global/protocol-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { deployments } from 'hardhat'
import crypto from 'crypto'
import { getSafeWebAuthnSignerFactoryContract } from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'
import { getAccounts } from './utils/setupTestNetwork'
import { itif, describeif } from './utils/helpers'
import { createMockPasskey, getWebAuthnCredentials, deployPasskeysContract } from './utils/passkeys'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const webAuthnCredentials = getWebAuthnCredentials()

if (!global.crypto) {
  global.crypto = crypto as unknown as Crypto
}

global.navigator = {
  credentials: {
    create: sinon.stub().callsFake(webAuthnCredentials.create.bind(webAuthnCredentials)),
    get: sinon.stub().callsFake(webAuthnCredentials.get.bind(webAuthnCredentials))
  }
} as unknown as Navigator

describe('Passkey', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()

    const passkey1 = await createMockPasskey('chucknorris')
    const passkey2 = await createMockPasskey('brucelee')

    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()
    const safeProvider = new SafeProvider({ provider })
    const customContracts = contractNetworks?.[chainId.toString()]

    const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
      safeProvider,
      safeVersion: '1.4.1',
      customContracts
    })

    const passkeySigner1 = new PasskeySigner(
      passkey1,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider()
    )

    const passkeySigner2 = new PasskeySigner(
      passkey2,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider()
    )

    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [await passkeySigner1.getAddress()],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }

    return {
      accounts: await getAccounts(),
      contractNetworks,
      predictedSafe,
      provider,
      passkeys: [passkey1, passkey2],
      passkeySigners: [passkeySigner1, passkeySigner2]
    }
  })

  describe('isOwner', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail for Safe versions lower than 1.3.0',
      async () => {
        const {
          contractNetworks,
          provider,
          accounts: [account1],
          passkeys: [passkey1]
        } = await setupTests()
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()

        // Create a Safe instance with an EOA signer
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        chai
          .expect(safeSdk.isOwner(passkey1))
          .to.be.rejectedWith(
            'Current version of the Safe does not support the Passkey signer functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if the Safe is not deployed', async () => {
      const {
        predictedSafe,
        contractNetworks,
        provider,
        passkeys: [passkey1]
      } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks,
        signer: passkey1
      })
      chai.expect(safeSdk.isOwner(passkey1)).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should return true if passkey signer is an owner of the connected Safe',
      async () => {
        const {
          contractNetworks,
          provider,
          passkeys: [passkey1],
          passkeySigners: [passkeySigner1]
        } = await setupTests()
        const passkeySigner1Address = await passkeySigner1.getAddress()
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeSdk = await Safe.init({
          provider,
          safeAddress: await safe.getAddress(),
          contractNetworks,
          signer: passkey1
        })

        const isOwner = await safeSdk.isOwner(passkey1)
        chai.expect(isOwner).to.be.true
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return false if an account is not an owner of the connected Safe',
      async () => {
        const {
          contractNetworks,
          provider,
          passkeys: [passkey1, passkey2],
          passkeySigners: [passkeySigner1]
        } = await setupTests()
        const passkeySigner1Address = await passkeySigner1.getAddress()
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeSdk = await Safe.init({
          provider,
          safeAddress: await safe.getAddress(),
          contractNetworks,
          signer: passkey1
        })

        const isOwner = await safeSdk.isOwner(passkey2)
        chai.expect(isOwner).to.be.false
      }
    )
  })
  describeif(safeVersionDeployed >= '1.3.0')('signTransaction', async () => {
    it('should sign a transaction with the current passkey signer', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()

      const passkeySigner1Address = await passkeySigner1.getAddress()
      const safe = await getSafeWithOwners([passkeySigner1Address])
      const safeAddress = await safe.getAddress()

      // First create transaction for the deployment of the passkey signer
      await deployPasskeysContract([passkeySigner1], account1.signer)

      // Passkey signer should be deployed now
      chai.expect(await account1.signer.provider.getCode(passkeySigner1Address)).length.to.be.gt(2)

      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        signer: passkey1
      })
      const tx = await safeSdk.createTransaction({
        transactions: [{ to: safeAddress, value: '0', data: '0x' }]
      })

      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
      // Create a Safe instance with an EOA signer to execute the transaction
      const safeSdkEOA = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      // The transaction can only be executed by an EOA signer
      const txResponse = await safeSdkEOA.executeTransaction(signedTx)
      await waitSafeTxReceipt(txResponse)
    })

    it('should fail if the signature is added by an account that is not an owner', async () => {
      const {
        contractNetworks,
        provider,
        passkeys,
        passkeySigners: [passkeySigner1]
      } = await setupTests()
      const passkey2 = passkeys[1]
      const passkeySigner1Address = await passkeySigner1.getAddress()
      const safe = await getSafeWithOwners([passkeySigner1Address])
      const safeAddress = await safe.getAddress()

      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        signer: passkey2
      })

      const tx = await safeSdk.createTransaction({
        transactions: [{ to: safeAddress, value: '0', data: '0x' }]
      })

      await chai
        .expect(safeSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })
  })

  describeif(safeVersionDeployed >= '1.3.0')('createRemoveOwnerTx', () => {
    it('should remove a passkey owner of a Safe and automaticaly decrement the threshold', async () => {
      const {
        accounts: [eoaOwner1, eoaOwner2],
        contractNetworks,
        provider,
        passkeys: [passkeyFormerOwner],
        passkeySigners: [passkeySigner]
      } = await setupTests()

      const passkeyFormerOwnerAddress = await passkeySigner.getAddress()
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, passkeyFormerOwnerAddress],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })

      chai.expect(await safeSdk.getThreshold()).to.be.eq(2)

      chai.expect(await safeSdk.getOwners()).to.include.members([passkeyFormerOwnerAddress])

      const removeOwnerTx = await safeSdk.createRemoveOwnerTx({
        passkey: passkeyFormerOwner
      })

      const approverSdk = await safeSdk.connect({
        signer: eoaOwner2.address
      })

      const approvedTx = await approverSdk.signTransaction(removeOwnerTx)
      const result = await safeSdk.executeTransaction(approvedTx)
      await waitSafeTxReceipt(result)

      chai.expect(await safeSdk.getOwners()).to.not.include(passkeyFormerOwner)
      chai.expect(await safeSdk.getThreshold()).to.be.eq(1)
    })

    it('should remove a passkey owner of a Safe and set the threshold', async () => {
      const {
        accounts: [eoaOwner1, eoaOwner2],
        contractNetworks,
        provider,
        passkeys: [passkeyFormerOwner],
        passkeySigners: [passkeySigner]
      } = await setupTests()

      const passkeyFormerOwnerAddress = await passkeySigner.getAddress()
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, passkeyFormerOwnerAddress],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })

      chai.expect(await safeSdk.getThreshold()).to.be.eq(2)

      chai.expect(await safeSdk.getOwners()).to.include.members([passkeyFormerOwnerAddress])

      const removeOwnerTx = await safeSdk.createRemoveOwnerTx({
        passkey: passkeyFormerOwner,
        threshold: 2
      })

      const approverSdk = await safeSdk.connect({
        signer: eoaOwner2.address
      })

      const approvedTx = await approverSdk.signTransaction(removeOwnerTx)
      const result = await safeSdk.executeTransaction(approvedTx)
      await waitSafeTxReceipt(result)

      chai.expect(await safeSdk.getOwners()).to.not.include(passkeyFormerOwner)
      chai.expect(await safeSdk.getThreshold()).to.be.eq(2)
    })

    it('should prevent a former passkey owner of a Safe to sign transactions', async () => {
      const {
        accounts: [account],
        contractNetworks,
        provider,
        passkeys: [passkeyFormerOwner],
        passkeySigners: [passkeySigner]
      } = await setupTests()

      const passkeyFormerOwnerAddress = await passkeySigner.getAddress()
      const safe = await getSafeWithOwners([account.address, passkeyFormerOwnerAddress], 1)

      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      await deployPasskeysContract([passkeySigner], account.signer)

      const signerSdk = await safeSdk.connect({
        signer: passkeyFormerOwner
      })

      chai.expect(await safeSdk.getOwners()).to.include.members([passkeyFormerOwnerAddress])

      const removeOwnerTx = await safeSdk.createRemoveOwnerTx({
        passkey: passkeyFormerOwner,
        threshold: 1
      })

      const result = await safeSdk.executeTransaction(removeOwnerTx)
      await waitSafeTxReceipt(result)

      chai.expect(await safeSdk.getOwners()).to.not.include(passkeyFormerOwner)

      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }

      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai
        .expect(signerSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })
  })

  describeif(safeVersionDeployed >= '1.3.0')('createSwapOwnerTx', () => {
    it('should replace any owner of a Safe with a passkey', async () => {
      const {
        accounts: [eoaOwner1, eoaOwner2, eoaOwner3],
        contractNetworks,
        provider,
        passkeys: [passkeyNewOwner],
        passkeySigners: [passkeySigner]
      } = await setupTests()

      const passkeyNewOwnerAddress = await passkeySigner.getAddress()
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, eoaOwner3.address],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })

      const currentOwners = await safeSdk.getOwners()

      chai
        .expect(currentOwners)
        .to.include.members([eoaOwner1.address, eoaOwner2.address, eoaOwner3.address])
      chai.expect(currentOwners).to.not.include(passkeyNewOwnerAddress)

      chai.expect(await safeSdk.getSafeProvider().isContractDeployed(passkeyNewOwnerAddress)).to.be
        .false

      const formerOwner = eoaOwner3.address
      const swapOwnerTx = await safeSdk.createSwapOwnerTx({
        oldOwnerAddress: formerOwner,
        newOwnerPasskey: passkeyNewOwner
      })

      const approverSdk = await safeSdk.connect({
        signer: eoaOwner2.address
      })

      const approvedTx = await approverSdk.signTransaction(swapOwnerTx)
      const result = await safeSdk.executeTransaction(approvedTx)
      await waitSafeTxReceipt(result)

      const newOwners = await safeSdk.getOwners()

      chai
        .expect(newOwners)
        .to.include.members([eoaOwner1.address, eoaOwner2.address, passkeyNewOwnerAddress])
      chai.expect(newOwners).to.not.include(formerOwner)

      chai.expect(await safeSdk.getSafeProvider().isContractDeployed(passkeyNewOwnerAddress)).to.be
        .true
    })

    it('should replace any owner of a Safe with a passkey if the passkey contract is deployed', async () => {
      const {
        accounts: [eoaOwner1],
        contractNetworks,
        provider,
        passkeys: [passkeyNewOwner],
        passkeySigners: [passkeySigner]
      } = await setupTests()

      const passkeyNewOwnerAddress = await passkeySigner.getAddress()
      const safe = await getSafeWithOwners([eoaOwner1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })

      await deployPasskeysContract([passkeySigner], eoaOwner1.signer)
      chai.expect(await safeSdk.getSafeProvider().isContractDeployed(passkeyNewOwnerAddress)).to.be
        .true
      const currentOwners = await safeSdk.getOwners()

      chai.expect(currentOwners).to.not.include(passkeyNewOwnerAddress)

      const formerOwner = eoaOwner1.address
      const swapOwnerTx = await safeSdk.createSwapOwnerTx({
        oldOwnerAddress: formerOwner,
        newOwnerPasskey: passkeyNewOwner
      })

      const result = await safeSdk.executeTransaction(swapOwnerTx)
      await waitSafeTxReceipt(result)

      const newOwners = await safeSdk.getOwners()

      chai.expect(newOwners).to.include.members([passkeyNewOwnerAddress])
    })

    it('should replace any passkey owner of a Safe', async () => {
      const {
        accounts: [eoaOwner1, newEoaOwner],
        contractNetworks,
        provider,
        passkeys: [passkeyOwner1, passkeyOwner2],
        passkeySigners: [passkeySigner1, passkeySigner2]
      } = await setupTests()

      const passkeyOwner1Address = await passkeySigner1.getAddress()
      const passkeyOwner2Address = await passkeySigner2.getAddress()

      await deployPasskeysContract([passkeySigner1, passkeySigner2], eoaOwner1.signer)
      const safe = await getSafeWithOwners(
        [passkeyOwner1Address, passkeyOwner2Address, eoaOwner1.address],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks,
        signer: passkeyOwner1
      })

      const currentOwners = await safeSdk.getOwners()

      chai
        .expect(currentOwners)
        .to.include.members([passkeyOwner1Address, passkeyOwner2Address, eoaOwner1.address])
      chai.expect(currentOwners).to.not.include(newEoaOwner.address)

      const swapOwnerTx = await safeSdk.createSwapOwnerTx({
        oldOwnerPasskey: passkeyOwner2,
        newOwnerAddress: newEoaOwner.address
      })

      const signedTx = await safeSdk.signTransaction(swapOwnerTx)

      const approverSdk = await safeSdk.connect({
        signer: eoaOwner1.address
      })

      const approvedTx = await approverSdk.signTransaction(signedTx)
      const result = await approverSdk.executeTransaction(approvedTx)
      await waitSafeTxReceipt(result)

      const newOwners = await safeSdk.getOwners()

      chai
        .expect(newOwners)
        .to.include.members([passkeyOwner1Address, eoaOwner1.address, newEoaOwner.address])
      chai.expect(newOwners).to.not.include(passkeyOwner2Address)
    })

    it('should enable a new passkey owner of a Safe to sign transactions', async () => {
      const {
        accounts: [owner],
        contractNetworks,
        provider,
        passkeys: [passkeyNewOwner]
      } = await setupTests()

      const safe = await getSafeWithOwners([owner.address])
      const safeAddress = await safe.getAddress()

      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      const swapOwnerTx = await safeSdk.createSwapOwnerTx({
        oldOwnerAddress: owner.address,
        newOwnerPasskey: passkeyNewOwner
      })
      const swapOwnerResult = await safeSdk.executeTransaction(swapOwnerTx)
      await waitSafeTxReceipt(swapOwnerResult)

      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }

      const safeSdk2 = await safeSdk.connect({
        signer: passkeyNewOwner
      })
      const tx = await safeSdk2.createTransaction({ transactions: [safeTransactionData] })
      const signedTx = await safeSdk2.signTransaction(tx)
      chai.expect(safeSdk.executeTransaction(signedTx)).to.not.be.rejected
    })
  })

  describeif(safeVersionDeployed >= '1.3.0')('createAddOwnerTx', () => {
    it('should add a passkey owner to a Safe and keep the same threshold', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()
      const passkeySigner1Address = await passkeySigner1.getAddress()

      // First create transaction for the deployment of the passkey signer
      await deployPasskeysContract([passkeySigner1], account1.signer)

      // Passkey signer should be deployed now
      chai.expect(await account1.signer.provider.getCode(passkeySigner1Address)).length.to.be.gt(2)

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })
      const initialThreshold = await safeSdk.getThreshold()
      const initialOwners = await safeSdk.getOwners()

      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)

      const tx = await safeSdk.createAddOwnerTx({ passkey: passkey1 })

      const txResponse = await safeSdk.executeTransaction(tx)

      await waitSafeTxReceipt(txResponse)

      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
      chai.expect(owners[1]).to.be.eq(account1.address)
    })

    it('should also deploy a passkey signer before adding as an owner if is not deployed yet', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()
      const passkeySigner1Address = await passkeySigner1.getAddress()

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })
      const initialThreshold = await safeSdk.getThreshold()
      const initialOwners = await safeSdk.getOwners()

      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)

      const tx = await safeSdk.createAddOwnerTx({ passkey: passkey1 })

      // Check that the passkey signer is not deployed yet
      chai.expect(await account1.signer.provider.getCode(passkeySigner1Address)).to.be.eq('0x')

      const txResponse = await safeSdk.executeTransaction(tx)

      await waitSafeTxReceipt(txResponse)

      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
      chai.expect(owners[1]).to.be.eq(account1.address)

      // Passkey signer should be deployed now
      chai.expect(await account1.signer.provider.getCode(passkeySigner1Address)).length.to.be.gt(2)
    })

    it('should add a passkey owner and update the threshold', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()
      const passkeySigner1Address = await passkeySigner1.getAddress()

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks
      })
      const newThreshold = 2
      const initialOwners = await safeSdk.getOwners()

      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)

      const tx = await safeSdk.createAddOwnerTx({
        passkey: passkey1,
        threshold: newThreshold
      })

      const txResponse = await safeSdk.executeTransaction(tx)

      await waitSafeTxReceipt(txResponse)

      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(newThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
      chai.expect(owners[1]).to.be.eq(account1.address)
    })
  })

  describeif(safeVersionDeployed >= '1.3.0')(
    'when signing the transaction with a passkey owner',
    () => {
      it('should add a passkey owner to a Safe and keep the same threshold', async () => {
        const {
          accounts: [account1],
          contractNetworks,
          provider,
          passkeys: [passkey1, passkey2],
          passkeySigners: [passkeySigner1, passkeySigner2]
        } = await setupTests()

        const passkeySigner1Address = await passkeySigner1.getAddress()
        const passkeySigner2Address = await passkeySigner2.getAddress()
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeAddress = await safe.getAddress()

        // First create transaction for the deployment of the passkey signer
        await deployPasskeysContract([passkeySigner1], account1.signer)

        // Passkey signer should be deployed now
        chai
          .expect(await account1.signer.provider.getCode(passkeySigner1Address))
          .length.to.be.gt(2)

        // Create a Safe instance with the passkey signer
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks,
          signer: passkey1
        })

        // Create a transaction to add another passkey owner
        const addOwnerTx = await safeSdk.createAddOwnerTx({ passkey: passkey2 })

        const initialThreshold = await safeSdk.getThreshold()
        const initialOwners = await safeSdk.getOwners()

        chai.expect(initialOwners.length).to.be.eq(1)
        chai.expect(initialOwners[0]).to.be.eq(passkeySigner1Address)

        // Sign the transaction with the passkey signer
        const signedAddOwnerTx = await safeSdk.signTransaction(addOwnerTx)

        // Create a Safe instance with an EOA signer to execute the transaction
        const safeSdkEOA = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        // The transaction can only be executed by an EOA signer
        const txResponse = await safeSdkEOA.executeTransaction(signedAddOwnerTx)
        await waitSafeTxReceipt(txResponse)

        const finalThreshold = await safeSdk.getThreshold()
        chai.expect(initialThreshold).to.be.eq(finalThreshold)

        const owners = await safeSdk.getOwners()
        chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
        chai.expect(owners[0]).to.be.eq(passkeySigner2Address)
        chai.expect(owners[1]).to.be.eq(passkeySigner1Address)
      })
    }
  )
})
