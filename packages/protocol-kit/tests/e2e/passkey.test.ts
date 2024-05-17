import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeProvider,
  passkeyArgType
} from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import crypto from 'crypto'
import PasskeySigner from '@safe-global/protocol-kit/utils/passkeys/PasskeySigner'
import { getSafeWebAuthnSignerFactoryContract } from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

global.crypto = crypto as unknown as Crypto

async function createMockPasskey(): Promise<passkeyArgType> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: { name: 'SHA-256' }
    },
    true,
    ['sign', 'verify']
  )
  const exportedPublicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)

  return { rawId: new Uint8Array([1, 2, 3]), publicKey: exportedPublicKey }
}

describe('Passkey', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()

    const passkey1 = await createMockPasskey()
    const passkey2 = await createMockPasskey()
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
      predictedSafe,
      provider,
      passkeys: [passkey1, passkey2],
      passkeySigner1
    }
  })

  describe('isOwner', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks, provider, passkeys } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks,
        signer: passkeys[0]
      })
      chai.expect(safeSdk.isOwner(passkeys[0])).to.be.rejectedWith('Safe is not deployed')
    })

    it('should return true if passkey signer is an owner of the connected Safe', async () => {
      const { contractNetworks, provider, passkeys, passkeySigner1 } = await setupTests()
      const passkeySigner1Address = await passkeySigner1.getAddress()
      const safe = await getSafeWithOwners([passkeySigner1Address])

      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks,
        signer: passkeys[0]
      })

      const isOwner = await safeSdk.isOwner(passkeys[0])
      chai.expect(isOwner).to.be.true
    })

    it('should return false if an account is not an owner of the connected Safe', async () => {
      const { contractNetworks, provider, passkeys, passkeySigner1 } = await setupTests()
      const passkeySigner1Address = await passkeySigner1.getAddress()
      const safe = await getSafeWithOwners([passkeySigner1Address])

      const safeSdk = await Safe.init({
        provider,
        safeAddress: await safe.getAddress(),
        contractNetworks,
        signer: passkeys[1]
      })

      const isOwner = await safeSdk.isOwner(passkeys[1])
      chai.expect(isOwner).to.be.false
    })
  })
})
