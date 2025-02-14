import { safeVersionDeployed, itif } from '@safe-global/testing-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { SafeProvider } from '@safe-global/protocol-kit/index'
import sinon from 'sinon'
import { createMockPasskey, getWebAuthnCredentials } from './utils/passkeys'
import { publicActions, walletActions } from 'viem'

chai.use(chaiAsPromised)

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

describe('Safe provider', () => {
  const provider = getEip1193Provider()

  describe('init', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail for a passkey signer and Safe <v1.3.0',
      async () => {
        const passKeySigner = await createMockPasskey('aName')

        chai
          .expect(
            SafeProvider.init({ provider, signer: passKeySigner, safeVersion: safeVersionDeployed })
          )
          .to.be.rejectedWith(
            'Current version of the Safe does not support the Passkey signer functionality'
          )
      }
    )

    it('should return an external provider (PublicClient) and signer (WalletClient) when using an EIP1193 provider', async () => {
      const safeProvider = await SafeProvider.init({ provider })

      chai.expect(safeProvider.getExternalProvider()).to.deep.include(publicActions)
      chai.expect(await safeProvider.getExternalSigner()).to.deep.include(walletActions)
    })

    it('should return an external provider (PublicClient) and signer (WalletClient) when using a private key', async () => {
      const safeProvider = await SafeProvider.init({
        provider: 'https://sepolia.gateway.tenderly.co',
        signer: '4ff03ace1395691975678c93449d552dc83df6b773a8024d4c368b39042a7610'
      })

      chai.expect(safeProvider.getExternalProvider()).to.deep.include(publicActions)
      chai.expect(await safeProvider.getExternalSigner()).to.deep.include(walletActions)
    })

    it('should return an undefined signer when using an RPC without signer', async () => {
      const safeProvider = await SafeProvider.init({
        provider: 'https://sepolia.gateway.tenderly.co'
      })

      chai.expect(safeProvider.getExternalProvider()).to.deep.include(publicActions)
      chai.expect(await safeProvider.getExternalSigner()).to.be.undefined
    })
  })
})
