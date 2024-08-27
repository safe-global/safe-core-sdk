import { safeVersionDeployed } from '@safe-global/testing-kit'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import Safe, {
  getPasskeyOwnerAddress,
  PredictedSafeProps,
  SafeProvider
} from '@safe-global/protocol-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { deployments } from 'hardhat'
import crypto from 'crypto'
import {
  getSafeWebAuthnSignerFactoryContract,
  getSafeWebAuthnSharedSignerContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners, getWebAuthnContract } from './utils/setupContracts'
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

Object.defineProperty(global, 'navigator', {
  value: {
    credentials: {
      create: sinon.stub().callsFake(webAuthnCredentials.create.bind(webAuthnCredentials)),
      get: sinon.stub().callsFake(webAuthnCredentials.get.bind(webAuthnCredentials))
    }
  },
  writable: true
})

describe('Passkey', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()

    const webAuthnContract = await getWebAuthnContract()
    const customVerifierAddress = webAuthnContract.address

    const passkey1 = { ...(await createMockPasskey('chucknorris')), customVerifierAddress }
    const passkey2 = { ...(await createMockPasskey('brucelee')), customVerifierAddress }

    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()
    const safeProvider = await SafeProvider.init(provider)
    const customContracts = contractNetworks?.[chainId.toString()]

    const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
      safeProvider,
      safeVersion: '1.4.1',
      customContracts
    })

    const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContract({
      safeProvider,
      safeVersion: '1.4.1',
      customContracts
    })

    const safeProvider1 = await SafeProvider.init(provider, passkey1, '1.4.1', contractNetworks)
    const safeProvider2 = await SafeProvider.init(provider, passkey2, '1.4.1', contractNetworks)

    const passkeySigner1 = await safeProvider1.getExternalSigner()
    const passkeySigner2 = await safeProvider2.getExternalSigner()

    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [passkeySigner1!.account.address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }

    return {
      safeProvider,
      accounts: await getAccounts(),
      contractNetworks,
      predictedSafe,
      provider,
      passkeys: [passkey1, passkey2],
      passkeySigners: [passkeySigner1, passkeySigner2],
      safeWebAuthnSignerFactoryContract,
      safeWebAuthnSharedSignerContract
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
        const safeAddress = safe.address

        // Create a Safe instance with an EOA signer
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        chai
          .expect(getPasskeyOwnerAddress(safeSdk, passkey1))
          .to.be.rejectedWith(
            'Current version of the Safe does not support the Passkey signer functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the address of the passkey signer',
      async () => {
        const {
          contractNetworks,
          provider,
          passkeys: [passkey1],
          passkeySigners: [passkeySigner1],
          safeWebAuthnSignerFactoryContract
        } = await setupTests()
        const passkeySigner1Address = passkeySigner1.account.address
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeSdk = await Safe.init({
          provider,
          safeAddress: safe.address,
          contractNetworks,
          signer: passkey1
        })

        const passkeyAddress = await getPasskeyOwnerAddress(safeSdk, passkey1)
        const [expectedPasskeyAddress] = await safeWebAuthnSignerFactoryContract.getSigner([
          BigInt(passkey1.coordinates.x),
          BigInt(passkey1.coordinates.y),
          BigInt(passkey1.customVerifierAddress)
        ])

        chai.expect(passkeyAddress).to.equals(expectedPasskeyAddress)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the shared signer address of the passkey signer',
      async () => {
        const {
          accounts: [EOAaccount1],
          contractNetworks,
          provider,
          passkeys: [passkey1],
          safeWebAuthnSharedSignerContract
        } = await setupTests()

        const sharedSignerContractAddress = safeWebAuthnSharedSignerContract.contractAddress

        const safe = await getSafeWithOwners([EOAaccount1.address])

        // configure the shared Signer passkey in the Safe Slot
        const safeSdk = await Safe.init({
          provider,
          safeAddress: safe.address,
          contractNetworks
        })

        const passkeyOwnerConfiguration = {
          ...passkey1.coordinates,
          verifiers: passkey1.customVerifierAddress
        }

        const { data: addSharedSignerAddressOwner } = await safeSdk.createAddOwnerTx({
          ownerAddress: sharedSignerContractAddress
        })

        const configureSharedSignerTransaction = {
          to: sharedSignerContractAddress,
          value: '0',
          data: safeWebAuthnSharedSignerContract.encode('configure', [passkeyOwnerConfiguration]),
          operation: OperationType.DelegateCall // DelegateCall required into the SafeWebAuthnSharedSigner instance in order for it to set its configuration.
        }

        const transactions = [addSharedSignerAddressOwner, configureSharedSignerTransaction]

        const configureSharedSignerSafeTransaction = await safeSdk.createTransaction({
          transactions
        })

        // Sign the configure the shared Signer transaction with the EOA signer
        const signedConfigureSharedSignerSafeTransaction = await safeSdk.signTransaction(
          configureSharedSignerSafeTransaction
        )

        chai.expect(await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, passkey1))).to.be
          .false

        const response = await safeSdk.executeTransaction(
          signedConfigureSharedSignerSafeTransaction
        )
        await waitSafeTxReceipt(response)

        const passkeyAddress = await getPasskeyOwnerAddress(safeSdk, passkey1)

        chai.expect(passkeyAddress).to.equals(sharedSignerContractAddress)
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

      const passkeyAddress = await getPasskeyOwnerAddress(safeSdk, passkey1)

      chai.expect(safeSdk.isOwner(passkeyAddress)).to.be.rejectedWith('Safe is not deployed')
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
        const passkeySigner1Address = passkeySigner1.account.address
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeSdk = await Safe.init({
          provider,
          safeAddress: safe.address,
          contractNetworks,
          signer: passkey1
        })

        const passkeyAddress = await getPasskeyOwnerAddress(safeSdk, passkey1)

        const isOwner = await safeSdk.isOwner(passkeyAddress)
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
        const passkeySigner1Address = passkeySigner1.account.address
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeSdk = await Safe.init({
          provider,
          safeAddress: safe.address,
          contractNetworks,
          signer: passkey1
        })

        const passkeyAddress = await getPasskeyOwnerAddress(safeSdk, passkey2)

        const isOwner = await safeSdk.isOwner(passkeyAddress)
        chai.expect(isOwner).to.be.false
      }
    )

    describe('Shared Signer passkey', async () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should return true if the passkey is a Shared Signer passkey owner of the connected Safe',
        async () => {
          const {
            accounts: [EOAaccount1],
            contractNetworks,
            provider,
            passkeys: [passkey1],
            safeWebAuthnSharedSignerContract
          } = await setupTests()

          const sharedSignerContractAddress = safeWebAuthnSharedSignerContract.contractAddress

          const safe = await getSafeWithOwners([EOAaccount1.address])

          // configure the shared Signer passkey in the Safe Slot
          const safeSdk = await Safe.init({
            provider,
            safeAddress: safe.address,
            contractNetworks
          })

          const passkeyOwnerConfiguration = {
            ...passkey1.coordinates,
            verifiers: passkey1.customVerifierAddress
          }

          const { data: addSharedSignerAddressOwner } = await safeSdk.createAddOwnerTx({
            ownerAddress: sharedSignerContractAddress
          })

          const configureSharedSignerTransaction = {
            to: sharedSignerContractAddress,
            value: '0',
            data: safeWebAuthnSharedSignerContract.encode('configure', [passkeyOwnerConfiguration]),
            operation: OperationType.DelegateCall // DelegateCall required into the SafeWebAuthnSharedSigner instance in order for it to set its configuration.
          }

          const transactions = [addSharedSignerAddressOwner, configureSharedSignerTransaction]

          const configureSharedSignerSafeTransaction = await safeSdk.createTransaction({
            transactions
          })

          // Sign the configure the shared Signer transaction with the EOA signer
          const signedConfigureSharedSignerSafeTransaction = await safeSdk.signTransaction(
            configureSharedSignerSafeTransaction
          )

          chai.expect(await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, passkey1))).to.be
            .false

          await safeSdk.executeTransaction(signedConfigureSharedSignerSafeTransaction)

          chai.expect(await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, passkey1))).to.be
            .true
        }
      )

      describeif(safeVersionDeployed >= '1.3.0')('swapOwner', () => {
        it('should rotate a shared signer passkey owner', async () => {
          const {
            accounts: [EOAaccount1],
            contractNetworks,
            provider,
            passkeys: [sharedSignerPasskey1, passkey2],
            safeWebAuthnSharedSignerContract
            // passkeySigners: [sharedPasskeySigner1]
          } = await setupTests()

          const sharedSignerContractAddress = safeWebAuthnSharedSignerContract.contractAddress

          const safe = await getSafeWithOwners([EOAaccount1.address])
          const safeAddress = safe.address

          // configure the shared Signer passkey in the Safe Slot
          const safeSdk = await Safe.init({
            provider,
            safeAddress,
            contractNetworks
          })

          const passkeyOwnerConfiguration = {
            ...sharedSignerPasskey1.coordinates,
            verifiers: sharedSignerPasskey1.customVerifierAddress
          }

          const { data: addSharedSignerAddressOwner } = await safeSdk.createAddOwnerTx({
            ownerAddress: sharedSignerContractAddress
          })

          const configureSharedSignerTransaction = {
            to: sharedSignerContractAddress,
            value: '0',
            data: safeWebAuthnSharedSignerContract.encode('configure', [passkeyOwnerConfiguration]),
            operation: OperationType.DelegateCall // DelegateCall required into the SafeWebAuthnSharedSigner instance in order for it to set its configuration.
          }

          const transactions = [addSharedSignerAddressOwner, configureSharedSignerTransaction]

          const configureSharedSignerSafeTransaction = await safeSdk.createTransaction({
            transactions
          })

          // Sign the configure the shared Signer transaction with the EOA signer
          const signedConfigureSharedSignerSafeTransaction = await safeSdk.signTransaction(
            configureSharedSignerSafeTransaction
          )

          await safeSdk.executeTransaction(signedConfigureSharedSignerSafeTransaction)

          chai.expect(
            await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, sharedSignerPasskey1))
          ).to.be.true
          chai.expect(await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, passkey2))).to.be
            .false

          const sharedSignerSafeSdk = await Safe.init({
            provider,
            safeAddress,
            contractNetworks,
            signer: sharedSignerPasskey1
          })

          // rotate the shared signer passkey
          const swapOwnerTx = await sharedSignerSafeSdk.createSwapOwnerTx({
            oldOwnerPasskey: sharedSignerPasskey1,
            newOwnerPasskey: passkey2
          })

          const signerSwapOwnerTx = await sharedSignerSafeSdk.signTransaction(swapOwnerTx)

          await safeSdk.executeTransaction(signerSwapOwnerTx)

          chai.expect(
            await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, sharedSignerPasskey1))
          ).to.be.false
          chai.expect(await safeSdk.isOwner(await getPasskeyOwnerAddress(safeSdk, passkey2))).to.be
            .true
        })
      })
    })
  })

  describeif(safeVersionDeployed >= '1.3.0')('signTransaction', async () => {
    it('should sign a transaction with the current passkey signer', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1],
        safeProvider
      } = await setupTests()

      const passkeySigner1Address = passkeySigner1.account.address
      const safe = await getSafeWithOwners([passkeySigner1Address])
      const safeAddress = safe.address

      // First create transaction for the deployment of the passkey signer
      await deployPasskeysContract([passkeySigner1], account1.signer)

      // Passkey signer should be deployed now
      chai.expect(await safeProvider.getContractCode(passkeySigner1Address)).length.to.be.gt(2)

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
      const passkeySigner1Address = passkeySigner1.account.address
      const safe = await getSafeWithOwners([passkeySigner1Address])
      const safeAddress = safe.address

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

      const passkeyFormerOwnerAddress = passkeySigner.account.address
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, passkeyFormerOwnerAddress],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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

      const passkeyFormerOwnerAddress = passkeySigner.account.address
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, passkeyFormerOwnerAddress],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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

      const passkeyFormerOwnerAddress = passkeySigner.account.address
      const safe = await getSafeWithOwners([account.address, passkeyFormerOwnerAddress], 1)

      const safeAddress = safe.address
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

      const passkeyNewOwnerAddress = passkeySigner.account.address
      const safe = await getSafeWithOwners(
        [eoaOwner1.address, eoaOwner2.address, eoaOwner3.address],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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

      const passkeyNewOwnerAddress = passkeySigner.account.address
      const safe = await getSafeWithOwners([eoaOwner1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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

      const passkeyOwner1Address = passkeySigner1.account.address
      const passkeyOwner2Address = passkeySigner2.account.address

      await deployPasskeysContract([passkeySigner1, passkeySigner2], eoaOwner1.signer)
      const safe = await getSafeWithOwners(
        [passkeyOwner1Address, passkeyOwner2Address, eoaOwner1.address],
        2
      )
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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
      const safeAddress = safe.address

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
        passkeySigners: [passkeySigner1],
        safeProvider
      } = await setupTests()
      const passkeySigner1Address = passkeySigner1.account.address

      // First create transaction for the deployment of the passkey signer
      await deployPasskeysContract([passkeySigner1], account1.signer)

      // Passkey signer should be deployed now
      chai.expect(await safeProvider.getContractCode(passkeySigner1Address)).length.to.be.gt(2)

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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
        passkeySigners: [passkeySigner1],
        safeProvider
      } = await setupTests()
      const passkeySigner1Address = passkeySigner1.account.address

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
        contractNetworks
      })
      const initialThreshold = await safeSdk.getThreshold()
      const initialOwners = await safeSdk.getOwners()

      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)

      const tx = await safeSdk.createAddOwnerTx({ passkey: passkey1 })

      // Check that the passkey signer is not deployed yet
      chai.expect(await safeProvider.getContractCode(passkeySigner1Address)).to.be.eq('0x')

      const txResponse = await safeSdk.executeTransaction(tx)

      await waitSafeTxReceipt(txResponse)

      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
      chai.expect(owners[1]).to.be.eq(account1.address)

      // Passkey signer should be deployed now
      chai.expect(await safeProvider.getContractCode(passkeySigner1Address)).length.to.be.gt(2)
    })

    it('should add a passkey owner and update the threshold', async () => {
      const {
        accounts: [account1],
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()
      const passkeySigner1Address = passkeySigner1.account.address

      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
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
          passkeySigners: [passkeySigner1, passkeySigner2],
          safeProvider
        } = await setupTests()

        const passkeySigner1Address = passkeySigner1.account.address
        const passkeySigner2Address = passkeySigner2.account.address
        const safe = await getSafeWithOwners([passkeySigner1Address])

        const safeAddress = safe.address

        // First create transaction for the deployment of the passkey signer
        await deployPasskeysContract([passkeySigner1], account1.signer)

        // Passkey signer should be deployed now
        chai.expect(await safeProvider.getContractCode(passkeySigner1Address)).length.to.be.gt(2)

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
