import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeProvider,
  passkeyArgType
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

chai.use(chaiAsPromised)
chai.use(sinonChai)

global.crypto = crypto as unknown as Crypto
global.navigator = { credentials: { get: sinon.stub() } } as unknown as Navigator

async function createKeypair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: { name: 'SHA-256' }
    },
    true,
    ['sign', 'verify']
  )
}

async function createMockPasskey(keyPair: CryptoKeyPair): Promise<passkeyArgType> {
  const exportedPublicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  console.log({ exportedPublicKey })
  return { rawId: new Uint8Array([1, 2, 3]), publicKey: exportedPublicKey }
}

async function sign(key: CryptoKey, data: string): Promise<ArrayBuffer> {
  const dataArray = ethers.getBytes(data)

  const rawSignature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      key,
      dataArray
    )
  )

  // Split the signature into r and s
  const r = rawSignature.slice(0, rawSignature.length / 2)
  const s = rawSignature.slice(rawSignature.length / 2)

  // Convert r and s to BigInts
  const rBigInt = BigInt(`0x${Buffer.from(r).toString('hex')}`)
  const sBigInt = BigInt(`0x${Buffer.from(s).toString('hex')}`)

  // Convert the BigInts to DER-encoded integers
  const rDer = Buffer.from(rBigInt.toString(16), 'hex')
  const sDer = Buffer.from(sBigInt.toString(16), 'hex')

  // Create the DER-encoded sequence
  const sequence = Buffer.concat([
    Buffer.from([0x02, rDer.length]), // Integer tag and length for r
    rDer,
    Buffer.from([0x02, sDer.length]), // Integer tag and length for s
    sDer
  ])

  // Create the final DER-encoded signature
  const derSignature = Buffer.concat([
    Buffer.from([0x30, sequence.length]), // Sequence tag and length
    sequence
  ])

  // Convert Node.js Buffer to ArrayBuffer
  const derSignatureArrayBuffer = derSignature.buffer.slice(
    derSignature.byteOffset,
    derSignature.byteOffset + derSignature.byteLength
  )

  return derSignatureArrayBuffer
}

function navigatorCredentialsGetResponseMock(signature: ArrayBuffer) {
  return {
    id: 'mockId',
    rawId: new Uint8Array([1, 2, 3]),
    response: {
      clientDataJSON: new TextEncoder().encode(
        JSON.stringify({
          type: 'webauthn.get',
          challenge: 'ThisMockChallengeHasExactlyForty-ThreeChars',
          origin: 'https://example.com'
        })
      ),
      authenticatorData: 'mockAuthenticatorData',
      signature
      // signature: new Uint8Array([
      //   0x30, 0x44, 0x02, 0x20, 0x3d, 0x46, 0x28, 0x7b, 0x8b, 0x22, 0x64, 0x20, 0x4f, 0x38, 0x50,
      //   0x3c, 0x06, 0x14, 0x9c, 0x97, 0x31, 0x22, 0x7f, 0xef, 0x46, 0x66, 0x2b, 0x74, 0xf1, 0x12,
      //   0x63, 0x1f, 0x88, 0x8f, 0x2e, 0x02, 0x02, 0x02, 0x97, 0x60, 0x50, 0x02, 0x62, 0xcd, 0xd,
      //   0x6a, 0x3d, 0x35, 0x4e, 0x7e, 0x8b, 0x4f, 0x24, 0xf6, 0x7f, 0x63, 0x4f, 0x07, 0x10, 0x5a,
      //   0x55, 0xb1, 0x74, 0xd7, 0x85, 0x2b, 0x8e, 0x1f, 0x0e, 0x16
      // ]).buffer
    },
    type: 'public-key'
  }
}

describe.only('Passkey', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()

    const keyPair1 = await createKeypair()
    const keyPair2 = await createKeypair()

    const navigator = { credentials: new WebAuthnCredentials() }

    const passkeyCredential = navigator.credentials.create({
      publicKey: {
        rp: {
          name: 'Safe',
          id: 'safe.global'
        },
        user: {
          id: ethers.getBytes(ethers.id('chucknorris')),
          name: 'chucknorris',
          displayName: 'Chuck Norris'
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

    const passkey1 = { rawId: passkeyCredential.rawId, publicKey: exportedPublicKey }
    // const passkey1 = await createMockPasskey(keyPair1)
    const passkey2 = await createMockPasskey(keyPair2)

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
      contractNetworks,
      navigator,
      predictedSafe,
      provider,
      keyPairs: [keyPair1, keyPair2],
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
        contractNetworks,
        provider,
        keyPairs: [keyPair1],
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()

      const passkeySigner1Address = await passkeySigner1.getAddress()
      const safe = await getSafeWithOwners([passkeySigner1Address])
      const safeAddress = await safe.getAddress()

      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        signer: passkey1
      })

      const tx = await safeSdk.createTransaction({
        transactions: [{ to: safeAddress, value: '0', data: '0x' }]
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      const signature = await sign(keyPair1.privateKey, txHash)

      global.navigator.credentials.get = sinon
        .stub()
        .resolves(navigatorCredentialsGetResponseMock(signature))

      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
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

  describe.only('createAddOwnerTx', async () => {
    it('should add an owner and keep the same threshold', async () => {
      const [account1] = await getAccounts()
      const {
        contractNetworks,
        provider,
        passkeys: [passkey1],
        passkeySigners: [passkeySigner1]
      } = await setupTests()

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

      // TODO: check if the signer is not deployed, but is deployed after the transaction is executed

      const txResponse = await safeSdk.executeTransaction(tx)

      await waitSafeTxReceipt(txResponse)

      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(await passkeySigner1.getAddress())
      chai.expect(owners[1]).to.be.eq(account1.address)
    })

    it.only('should create a transaction to add an owner to a deployed Safe', async () => {
      const [account1] = await getAccounts()
      const {
        contractNetworks,
        navigator,
        provider,
        passkeys: [passkey1, passkey2],
        passkeySigners: [passkeySigner1, passkeySigner2]
      } = await setupTests()

      global.navigator.credentials.get = sinon
        .stub()
        .callsFake(navigator.credentials.get.bind(navigator.credentials))

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
      console.log({ signedAddOwnerTx })

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
      chai.expect(owners[0]).to.be.eq(passkeySigner1Address)
      chai.expect(owners[1]).to.be.eq(passkeySigner2Address)
    })
  })
})
