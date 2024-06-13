import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeProvider,
  PasskeyArgType
} from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { deployments } from 'hardhat'
import crypto from 'crypto'
import { ethers } from 'ethers'
import PasskeySigner from '@safe-global/protocol-kit/utils/passkeys/PasskeySigner'
import { getSafeWebAuthnSignerFactoryContract } from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'
import { getAccounts } from './utils/setupTestNetwork'
import { WebAuthnCredentials } from './utils/webauthnShim'
import { itif } from './utils/helpers'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const webAuthnCredentials = new WebAuthnCredentials()

if (!global.crypto) {
  global.crypto = crypto as unknown as Crypto
}

global.navigator = {
  credentials: {
    create: sinon.stub().callsFake(webAuthnCredentials.create.bind(webAuthnCredentials)),
    get: sinon.stub().callsFake(webAuthnCredentials.get.bind(webAuthnCredentials))
  }
} as unknown as Navigator

/**
 * Creates a mock passkey for testing purposes.
 * @param name User name used for passkey mock
 * @returns Passkey arguments
 */
async function createMockPasskey(name: string): Promise<PasskeyArgType> {
  const passkeyCredential = await webAuthnCredentials.create({
    publicKey: {
      rp: {
        name: 'Safe',
        id: 'safe.global'
      },
      user: {
        id: ethers.getBytes(ethers.id(name)),
        name: name,
        displayName: name
      },
      challenge: ethers.toBeArray(Date.now()),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
    }
  })

  const algorithm = {
    name: 'ECDSA',
    namedCurve: 'P-256',
    hash: { name: 'SHA-256' }
  }
  const key = await crypto.subtle.importKey(
    'raw',
    passkeyCredential.response.getPublicKey(),
    algorithm,
    true,
    ['verify']
  )
  const exportedPublicKey = await crypto.subtle.exportKey('spki', key)

  return { rawId: passkeyCredential.rawId, publicKey: exportedPublicKey }
}

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

    const passkeySigner1 = await PasskeySigner.init(
      passkey1,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider()
    )

    const passkeySigner2 = await PasskeySigner.init(
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
    it('should fail if the Safe is not deployed', async () => {
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

    it('should return true if passkey signer is an owner of the connected Safe', async () => {
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
    })

    it('should return false if an account is not an owner of the connected Safe', async () => {
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
    })
  })

  describe('signTransaction', async () => {
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

  describe('createSwapOwnerTx', () => {
    describe('when signing the transaction with an EOA', () => {
      it.only('should swap a passkey owner in', async () => {
        const {
          accounts: [eoaOwner1, eoaOwner2, eoaOwner3],
          contractNetworks,
          provider,
          passkeys: [passkeyNewOwner],
          passkeySigners: [passkeySigner]
        } = await setupTests()

        const newPasskeyOwnerAddress = await passkeySigner.getAddress()
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
        chai.expect(currentOwners).to.not.include(newPasskeyOwnerAddress)

        const formerOwner = eoaOwner3.address
        const swapOwnerTransaction = await safeSdk.createSwapOwnerTx({
          oldOwnerAddress: formerOwner,
          newOwnerPasskey: passkeyNewOwner
        })

        const approverSdk = await safeSdk.connect({
          signer: eoaOwner2.address
        })

        const approvedTransaction = await approverSdk.signTransaction(swapOwnerTransaction)
        const result = await safeSdk.executeTransaction(approvedTransaction)
        await waitSafeTxReceipt(result)

        const newOwners = await safeSdk.getOwners()

        chai
          .expect(newOwners)
          .to.include.members([eoaOwner1.address, eoaOwner2.address, newPasskeyOwnerAddress])
        chai.expect(newOwners).to.not.include(formerOwner)
      }).timeout(1000000000000)

      it('should swap a passkey owner out', async () => {
        const {
          accounts: [eoaOwner1, newEoaOwner],
          contractNetworks,
          provider,
          passkeys,
          passkeySigners: [passkeySigner1, passkeySigner2]
        } = await setupTests()

        const passkeyOwner2 = passkeys[1]
        const passkeyOwner1Address = await passkeySigner1.getAddress()
        const passkeyOwner2Address = await passkeySigner2.getAddress()
        const safe = await getSafeWithOwners(
          [passkeyOwner1Address, passkeyOwner2Address, eoaOwner1.address],
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
          .to.include.members([passkeyOwner1Address, passkeyOwner2Address, eoaOwner1.address])
        chai.expect(currentOwners).to.not.include(newEoaOwner.address)

        const swapOwnerTransaction = await safeSdk.createSwapOwnerTx({
          oldOwnerPasskey: passkeyOwner2,
          newOwnerAddress: newEoaOwner.address
        })

        const signedTransaction = await safeSdk.signTransaction(swapOwnerTransaction)

        const approverSdk = await safeSdk.connect({
          signer: eoaOwner1.address
        })

        const approvedTransaction = await approverSdk.signTransaction(signedTransaction)
        const result = await safeSdk.executeTransaction(approvedTransaction)
        await waitSafeTxReceipt(result)

        const newOwners = await safeSdk.getOwners()

        chai
          .expect(newOwners)
          .to.include.members([passkeyOwner1Address, eoaOwner1.address, newEoaOwner.address])
        chai.expect(newOwners).to.not.include(passkeyOwner2Address)
      }).timeout(100000000)

      itif(safeVersionDeployed >= '1.3.0')(
        'should enable a new passkey owner to sign transactions',
        async () => {
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

          const swapOwnerTransaction = await safeSdk.createSwapOwnerTx({
            oldOwnerAddress: owner.address,
            newOwnerPasskey: passkeyNewOwner
          })
          const swapOwnerResult = await safeSdk.executeTransaction(swapOwnerTransaction)
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
        }
      )
    })
  })

  describe('createAddOwnerTx', () => {
    describe('when signing the transaction with an EOA', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should add a passkey owner to a Safe and keep the same threshold',
        async () => {
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
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should also deploy a passkey signer before adding as an owner if is not deployed yet',
        async () => {
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
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should add a passkey owner and update the threshold',
        async () => {
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

          const tx = await safeSdk.createAddOwnerTx({ passkey: passkey1, threshold: newThreshold })

          const txResponse = await safeSdk.executeTransaction(tx)

          await waitSafeTxReceipt(txResponse)

          const finalThreshold = await safeSdk.getThreshold()
          chai.expect(newThreshold).to.be.eq(finalThreshold)
          const owners = await safeSdk.getOwners()
          chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
          chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
          chai.expect(owners[1]).to.be.eq(account1.address)
        }
      )
    })

    describe('when signing the transaction with a passkey owner', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should add a passkey owner to a Safe and keep the same threshold',
        async () => {
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
        }
      )
    })
  })
})
