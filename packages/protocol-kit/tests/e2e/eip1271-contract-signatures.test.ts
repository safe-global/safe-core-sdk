import Safe, { buildContractSignature, hashSafeMessage } from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { SigningMethod } from '@safe-global/protocol-kit/types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { itif } from './utils/helpers'

chai.use(chaiAsPromised)

describe('The EIP1271 implementation', () => {
  describe('In the context of a 3/3 Safe account with a 4/4 signer Safe account owner', async () => {
    const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
      await deployments.fixture()
      const accounts = await getAccounts()
      const chainId = await getChainId()
      const contractNetworks = await getContractNetworks(BigInt(chainId))
      const fallbackHandlerAddress = contractNetworks[chainId].fallbackHandlerAddress
      const [account1, account2, account3, account4, account5] = accounts

      // Create a 1/1 signer Safe
      const signerSafe1_1 = await getSafeWithOwners(
        [account3.address],
        1, // Require 1 signatures
        fallbackHandlerAddress
      )
      const signerSafeAddress1_1 = await signerSafe1_1.getAddress()

      // Create a 2/3 signer Safe
      const signerSafe2_3 = await getSafeWithOwners(
        [account4.address, account5.address],
        2, // Require 2 signatures
        fallbackHandlerAddress
      )
      const signerSafeAddress2_3 = await signerSafe2_3.getAddress()

      // Create a 3/4 Safe with the signer Safe as owner
      const safe = await getSafeWithOwners(
        [account1.address, account2.address, signerSafeAddress1_1, signerSafeAddress2_3],
        4, // Require 4 signatures
        fallbackHandlerAddress
      )

      const safeAddress = await safe.getAddress()

      return {
        safe,
        safeAddress,
        signerSafe1_1,
        signerSafeAddress1_1,
        signerSafe2_3,
        signerSafeAddress2_3,
        accounts,
        contractNetworks,
        chainId,
        fallbackHandlerAddress
      }
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to sign and execute transactions',
      async () => {
        const {
          safeAddress,
          accounts,
          signerSafeAddress1_1,
          signerSafeAddress2_3,
          contractNetworks
        } = await setupTests()

        // Create adapters and the protocol kit instance
        const [account1, account2, account3, account4, account5] = accounts

        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const ethAdapter4 = await getEthAdapter(account4.signer)
        const ethAdapter5 = await getEthAdapter(account5.signer)

        let protocolKit = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })

        // Create the transaction. Send 0.01 ETH to account1
        const safeTransactionData: SafeTransactionDataPartial = {
          to: account1.address,
          value: '100000000000000000', // 0.01 ETH
          data: '0x'
        }

        let tx = await protocolKit.createTransaction({ transactions: [safeTransactionData] })

        chai.expect(await protocolKit.getNonce()).to.be.eq(0)

        // EOA signatures
        tx = await protocolKit.signTransaction(tx) // Owner 1 signature
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter2 }) // Connect another owner
        tx = await protocolKit.signTransaction(tx) // Owner 2 signature

        // 1/1 Signer Safe signature
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter3,
          safeAddress: signerSafeAddress1_1
        })
        let signerSafeTx1_1 = await protocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        signerSafeTx1_1 = await protocolKit.signTransaction(
          signerSafeTx1_1,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig1_1 = await buildContractSignature(
          Array.from(signerSafeTx1_1.signatures.values()),
          signerSafeAddress1_1
        )
        tx.addSignature(signerSafeSig1_1)

        // 2/3 Signer Safe signature
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter4,
          safeAddress: signerSafeAddress2_3
        })
        let signerSafeTx2_3 = await protocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        signerSafeTx2_3 = await protocolKit.signTransaction(
          signerSafeTx2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter5 })
        signerSafeTx2_3 = await protocolKit.signTransaction(
          signerSafeTx2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig2_3 = await buildContractSignature(
          Array.from(signerSafeTx2_3.signatures.values()),
          signerSafeAddress2_3
        )
        tx.addSignature(signerSafeSig2_3)

        // Connect the original Safe, send some funds and execute the transaction
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter1, safeAddress })
        const execResponse = await protocolKit.executeTransaction(tx)

        await waitSafeTxReceipt(execResponse)

        // Ensure the nonce has been increased
        chai.expect(await protocolKit.getNonce()).to.be.eq(1)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to sign and validate typed messages',
      async () => {
        const {
          safeAddress,
          accounts,
          signerSafeAddress1_1,
          signerSafeAddress2_3,
          contractNetworks,
          chainId
        } = await setupTests()

        const MESSAGE = {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' }
            ],
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallets', type: 'address[]' }
            ],
            Mail: [
              { name: 'from', type: 'Person' },
              { name: 'to', type: 'Person[]' },
              { name: 'contents', type: 'string' }
            ]
          },
          domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: Number(chainId),
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
          },
          primaryType: 'Mail',
          message: {
            from: {
              name: 'Cow',
              wallets: [
                '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
              ]
            },
            to: [
              {
                name: 'Bob',
                wallets: [
                  '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                  '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                  '0xB0B0b0b0b0b0B000000000000000000000000000'
                ]
              }
            ],
            contents: 'Hello, Bob!'
          }
        }

        // Create adapters and the protocol kit instance
        const [account1, account2, account3, account4, account5] = accounts

        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const ethAdapter4 = await getEthAdapter(account4.signer)
        const ethAdapter5 = await getEthAdapter(account5.signer)

        let protocolKit = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })

        let message = protocolKit.createMessage(MESSAGE)

        // EOA signatures
        message = await protocolKit.signMessage(message) // Owner 1 signature
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter2 }) // Connect another owner
        message = await protocolKit.signMessage(message) // Owner 2 signature

        // 1/1 Signer Safe signature
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter3,
          safeAddress: signerSafeAddress1_1
        })
        let signerSafeMessage1_1 = protocolKit.createMessage(MESSAGE)
        signerSafeMessage1_1 = await protocolKit.signMessage(
          signerSafeMessage1_1,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig1_1 = await buildContractSignature(
          Array.from(signerSafeMessage1_1.signatures.values()),
          signerSafeAddress1_1
        )
        message.addSignature(signerSafeSig1_1)

        // 2/3 Signer Safe signature
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter4,
          safeAddress: signerSafeAddress2_3
        })
        let signerSafeMessage2_3 = protocolKit.createMessage(MESSAGE)
        signerSafeMessage2_3 = await protocolKit.signMessage(
          signerSafeMessage2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter5 })
        signerSafeMessage2_3 = await protocolKit.signMessage(
          signerSafeMessage2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig2_3 = await buildContractSignature(
          Array.from(signerSafeMessage2_3.signatures.values()),
          signerSafeAddress2_3
        )
        message.addSignature(signerSafeSig2_3)

        // Connect the original Safe
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter1, safeAddress })

        chai.expect(
          await protocolKit.isValidSignature(hashSafeMessage(MESSAGE), message.encodedSignatures())
        ).to.be.true
      }
    )
  })
})
