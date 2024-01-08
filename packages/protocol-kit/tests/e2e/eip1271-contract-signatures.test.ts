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

      // Create a 4/4 signer Safe
      const signerSafe = await getSafeWithOwners(
        [account2.address, account3.address, account4.address, account5.address],
        4, // Require 4 signatures
        fallbackHandlerAddress
      )
      const signerSafeAddress = await signerSafe.getAddress()

      // Create a 3/3 Safe with the signer Safe as owner
      const safe = await getSafeWithOwners(
        [account1.address, account2.address, signerSafeAddress],
        3, // Require 3 signatures
        fallbackHandlerAddress
      )
      const safeAddress = await safe.getAddress()

      return {
        safe,
        safeAddress,
        signerSafe,
        signerSafeAddress,
        accounts,
        contractNetworks,
        chainId,
        fallbackHandlerAddress
      }
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to sign and execute transactions',
      async () => {
        const { safeAddress, accounts, signerSafeAddress, contractNetworks } = await setupTests()

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

        // Produce normal signatures
        tx = await protocolKit.signTransaction(tx) // Owner 1 signature
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter2 }) // Connect another owner
        tx = await protocolKit.signTransaction(tx) // Owner 2 signature

        // Smart contract signature (Connect owners and sign)
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter2,
          safeAddress: signerSafeAddress
        })
        let signerSafeTx = await protocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        signerSafeTx = await protocolKit.signTransaction(
          signerSafeTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter3 })
        signerSafeTx = await protocolKit.signTransaction(
          signerSafeTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter4 })
        signerSafeTx = await protocolKit.signTransaction(
          signerSafeTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter5 })
        signerSafeTx = await protocolKit.signTransaction(
          signerSafeTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )

        const signerSafeSig = await buildContractSignature(
          Array.from(signerSafeTx.signatures.values()),
          signerSafeAddress
        )

        // Add the signer Safe signature to the original Safe transaction
        tx.addSignature(signerSafeSig)

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
        const { safeAddress, accounts, signerSafeAddress, contractNetworks, chainId } =
          await setupTests()

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

        // Produce normal signatures
        message = await protocolKit.signMessage(message) // Owner 1 signature
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter2 }) // Connect another owner
        message = await protocolKit.signMessage(message) // Owner 2 signature

        // Smart contract signature (Connect owners and sign)
        protocolKit = await protocolKit.connect({
          ethAdapter: ethAdapter2,
          safeAddress: signerSafeAddress
        })
        let signerSafeMessage = protocolKit.createMessage(MESSAGE)
        signerSafeMessage = await protocolKit.signMessage(
          signerSafeMessage,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter3 })
        signerSafeMessage = await protocolKit.signMessage(
          signerSafeMessage,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter4 })
        signerSafeMessage = await protocolKit.signMessage(
          signerSafeMessage,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter5 })
        signerSafeMessage = await protocolKit.signMessage(
          signerSafeMessage,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )

        const signerSafeSig = await buildContractSignature(
          Array.from(signerSafeMessage.signatures.values()),
          signerSafeAddress
        )

        // Add the signer Safe signature to the original Safe transaction
        message.addSignature(signerSafeSig)

        protocolKit = await protocolKit.connect({ ethAdapter: ethAdapter1, safeAddress })

        chai.expect(
          await protocolKit.isValidSignature(hashSafeMessage(MESSAGE), message.encodedSignatures())
        ).to.be.true
      }
    )
  })
})
