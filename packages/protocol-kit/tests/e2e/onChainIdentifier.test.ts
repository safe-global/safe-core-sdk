import { setupTests, safeVersionDeployed } from '@safe-global/testing-kit'
import Safe, {
  generateOnChainIdentifier,
  OnchainAnalyticsProps,
  PredictedSafeProps,
  SafeAccountConfig
} from '@safe-global/protocol-kit/index'
import chai from 'chai'
import sinon from 'sinon'
import chaiAsPromised from 'chai-as-promised'

import { generateHash } from '@safe-global/protocol-kit/utils/on-chain-tracking/generateOnChainIdentifier'
import * as getProtocolKitVersionModule from '@safe-global/protocol-kit/utils/getProtocolKitVersion'
import { getProtocolKitVersion } from '@safe-global/protocol-kit/utils/getProtocolKitVersion'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('On-chain analytics', () => {
  const provider = getEip1193Provider()

  describe('generateOnChainIdentifier fn', () => {
    it('should return the correct on-chain identifier format', async () => {
      const project = 'Test e2e Project'
      const platform = 'Web'
      const tool = 'protocol-kit'
      const toolVersion = '1.0.0'

      const onChainIdentifier = generateOnChainIdentifier({ project, platform, tool, toolVersion })

      const identifierPrefix = '5afe'
      const identifierVersion = '00'

      // These are pinned as hard-coded constants (independently computed from the real
      // keccak256 digest) rather than by re-calling generateHash, which would make this
      // assertion vacuous against its own implementation and unable to catch a regression
      // in generateHash's behavior. See generateHash's doc comment for why these values look
      // like ASCII hex digits rather than raw hash bytes: that's a known, already-shipped
      // (not byte-accurate) truncation behavior this test intentionally pins as-is.
      const projectHash = '3861653435366632366138366164643038373864'
      const platformHash = '646561'
      const toolHash = '393238'
      const toolVersionHash = '373263'

      chai.expect(onChainIdentifier.startsWith(identifierPrefix)).to.be.true
      chai.expect(onChainIdentifier.substring(4, 6)).to.equals(identifierVersion)
      chai.expect(onChainIdentifier.substring(6, 46)).to.equals(projectHash)
      chai.expect(onChainIdentifier.substring(46, 52)).to.equals(platformHash)
      chai.expect(onChainIdentifier.substring(52, 58)).to.equals(toolHash)
      chai.expect(onChainIdentifier.substring(58, 64)).to.equals(toolVersionHash)

      // Exact aggregate equality pins the complete format (including that there's no
      // trailing data beyond what the substring assertions above check individually).
      chai
        .expect(onChainIdentifier)
        .to.equals(
          `${identifierPrefix}${identifierVersion}${projectHash}${platformHash}${toolHash}${toolVersionHash}`
        )

      // Cross-check against generateHash directly, so a change to either the aggregate
      // identifier assembly or the hash function itself is caught by at least one assertion.
      chai.expect(generateHash(project, 20)).to.equals(projectHash)
      chai.expect(generateHash(platform, 3)).to.equals(platformHash)
      chai.expect(generateHash(tool, 3)).to.equals(toolHash)
      chai.expect(generateHash(toolVersion, 3)).to.equals(toolVersionHash)
    })
  })

  describe('getOnchainIdentifier method', () => {
    it('should return the on-chain identifier when provided', async () => {
      const onchainAnalytics: OnchainAnalyticsProps = {
        project: 'Test e2e Project',
        platform: 'Web'
      }

      const stub = sinon.stub(getProtocolKitVersionModule, 'getProtocolKitVersion').returns('5.0.4')

      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        onchainAnalytics
      })

      const onChainIdentifier = '5afe003861653435366632366138366164643038373864646561393238653366'

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
      stub.restore()
    })

    it('should return an empty string when no onchain Analiticts is provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      chai.expect(protocolKit.getOnchainIdentifier()).to.empty
    })
  })

  describe('Tracking Safe Deployment on-chain via the transaction data field', () => {
    it('should append the on-chain identifier to the deployment transaction data field', async () => {
      const onchainAnalytics: OnchainAnalyticsProps = {
        project: 'Test e2e Project',
        platform: 'Web'
      }

      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 1
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const protocolKit = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks,
        onchainAnalytics
      })

      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

      // toolVersion is dynamic (currrent protocol-kit version)
      const toolVersion = getProtocolKitVersion()
      const toolHash = generateHash(toolVersion, 3)

      const onChainIdentifier =
        '5afe003861653435366632366138366164643038373864646561393238' + toolHash

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
      chai.expect(deploymentTransaction.data.endsWith(onChainIdentifier)).to.be.true
    })
  })

  describe('Tracking Safe transactions on-chain via the transaction data field', () => {
    it('should append the on-chain identifier to the execTransaction data field', async () => {
      const onchainAnalytics: OnchainAnalyticsProps = {
        project: 'Test e2e Project',
        platform: 'Web'
      }

      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        onchainAnalytics
      })

      const testTransaction = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }

      const safeTransaction = await protocolKit.createTransaction({
        transactions: [testTransaction]
      })

      const isValidTransaction = await protocolKit.isValidTransaction(safeTransaction)
      chai.expect(isValidTransaction).to.be.eq(true)

      const transactionResponse = await protocolKit.executeTransaction(safeTransaction)

      await waitSafeTxReceipt(transactionResponse)

      const transaction = await protocolKit
        .getSafeProvider()
        .getTransaction(transactionResponse.hash)

      // toolVersion is dynamic (currrent protocol-kit version)
      const toolVersion = getProtocolKitVersion()
      const toolHash = generateHash(toolVersion, 3)

      const onChainIdentifier =
        '5afe003861653435366632366138366164643038373864646561393238' + toolHash

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
      chai.expect(transaction.input.endsWith(onChainIdentifier)).to.be.true
    })
  })
})
