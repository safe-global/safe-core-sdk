import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import Safe, { PredictedSafeProps, SafeProvider } from '@safe-global/protocol-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { deployments } from 'hardhat'
import crypto from 'crypto'
import PasskeySigner from '@safe-global/protocol-kit/utils/passkeys/PasskeySigner'
import {
  getSafeWebAuthnSharedSignerContract,
  getSafeWebAuthnSignerFactoryContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners, getWebAuthnContract } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'
import { getAccounts } from './utils/setupTestNetwork'
import { itif, describeif } from './utils/helpers'
import { createMockPasskey, getWebAuthnCredentials } from './utils/passkeys'

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
    const customVerifierAddress = await webAuthnContract.getAddress()

    const passkey1 = { ...(await createMockPasskey('chucknorris')), customVerifierAddress }
    const passkey2 = { ...(await createMockPasskey('brucelee')), customVerifierAddress }

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

    const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContract({
      safeProvider,
      safeVersion: '1.4.1',
      customContracts
    })

    const passkeySigner1 = new PasskeySigner(
      passkey1,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider(),
      chainId.toString()
    )

    const passkeySigner2 = new PasskeySigner(
      passkey2,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider(),
      chainId.toString()
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
      passkeySigners: [passkeySigner1, passkeySigner2],
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

          const sharedSignerContractAddress = await safeWebAuthnSharedSignerContract.getAddress()

          const safe = await getSafeWithOwners([EOAaccount1.address])

          // configure the shared Signer passkey in the Safe Slot
          const safeSdk = await Safe.init({
            provider,
            safeAddress: await safe.getAddress(),
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

          chai.expect(await safeSdk.isOwner(passkey1)).to.be.false

          await safeSdk.executeTransaction(signedConfigureSharedSignerSafeTransaction)

          chai.expect(await safeSdk.isOwner(passkey1)).to.be.true
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

          const sharedSignerContractAddress = await safeWebAuthnSharedSignerContract.getAddress()

          const safe = await getSafeWithOwners([EOAaccount1.address])
          const safeAddress = await safe.getAddress()

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

          chai.expect(await safeSdk.isOwner(sharedSignerPasskey1)).to.be.true
          chai.expect(await safeSdk.isOwner(passkey2)).to.be.false

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

          chai.expect(await safeSdk.isOwner(sharedSignerPasskey1)).to.be.false
          chai.expect(await safeSdk.isOwner(passkey2)).to.be.true
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
          passkeySigners: [passkeySigner1]
        } = await setupTests()

        const passkeySigner1Address = await passkeySigner1.getAddress()
        const safe = await getSafeWithOwners([passkeySigner1Address])
        const safeAddress = await safe.getAddress()

        // First create transaction for the deployment of the passkey signer
        const createPasskeySignerTransaction = {
          to: await passkeySigner1.safeWebAuthnSignerFactoryContract.getAddress(),
          value: '0',
          data: passkeySigner1.encodeCreateSigner()
        }
        // Deploy the passkey signer
        await account1.signer.sendTransaction(createPasskeySignerTransaction)
        // Passkey signer should be deployed now
        chai
          .expect(await account1.signer.provider.getCode(passkeySigner1Address))
          .length.to.be.gt(2)

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
        const createPasskeySignerTransaction = {
          to: await passkeySigner1.safeWebAuthnSignerFactoryContract.getAddress(),
          value: '0',
          data: passkeySigner1.encodeCreateSigner(),
          signer: account1
        }

        // Deploy the passkey signer
        await account1.signer.sendTransaction(createPasskeySignerTransaction)

        // Passkey signer should be deployed now
        chai
          .expect(await account1.signer.provider.getCode(passkeySigner1Address))
          .length.to.be.gt(2)

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
        chai
          .expect(await account1.signer.provider.getCode(passkeySigner1Address))
          .length.to.be.gt(2)
      })

      it('should add a passkey owner and update the threshold', async () => {
        // TODO: replicate this
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
          const createPasskeySignerTransaction = {
            to: await passkeySigner1.safeWebAuthnSignerFactoryContract.getAddress(),
            value: '0',
            data: passkeySigner1.encodeCreateSigner()
          }
          // Deploy the passkey signer
          await account1.signer.sendTransaction(createPasskeySignerTransaction)

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
})
