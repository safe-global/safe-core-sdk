import { setupTests, safeVersionDeployed } from '@safe-global/testing-kit'
import Safe, {
  generateOnChainIdentifier,
  OnchainAnaliticsProps,
  PredictedSafeProps,
  SafeAccountConfig
} from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'
import { generateHash } from '@safe-global/protocol-kit/utils/on-chain-tracking/generateOnChainIdentifier'

chai.use(chaiAsPromised)

describe('On-chain analytics', () => {
  const provider = getEip1193Provider()

  describe('generateOnChainIdentifier fn', () => {
    it('should return the correct on-chain identifier format', async () => {
      const project = 'Test e2e Project'
      const platform = 'Web'
      const tool = 'protocol-kit'
      const toolVersion = '1.0.0'

      const onChainIdentifier = generateOnChainIdentifier(project, platform, tool, toolVersion)

      const identifierPrefix = '5afe'
      const identifierVersion = '00'

      chai.expect(onChainIdentifier.startsWith(identifierPrefix)).to.be.true
      chai.expect(onChainIdentifier.substring(4, 6)).to.equals(identifierVersion)
      chai.expect(onChainIdentifier.substring(6, 46)).to.equals(generateHash(project, 20))
      chai.expect(onChainIdentifier.substring(46, 52)).to.equals(generateHash(platform, 3))
      chai.expect(onChainIdentifier.substring(52, 58)).to.equals(generateHash(tool, 3))
      chai.expect(onChainIdentifier.substring(58, 64)).to.equals(generateHash(toolVersion, 3))
    })
  })

  describe('getOnchainIdentifier method', () => {
    it('should return the on-chain identifier when provided', async () => {
      const onchainAnalitics: OnchainAnaliticsProps = {
        project: 'Test e2e Project',
        platform: 'Web'
      }

      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        onchainAnalitics
      })

      const onChainIdentifier = '5afe003861653435366632366138366164643038373864646561393238653366'

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
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
      const onchainAnalitics: OnchainAnaliticsProps = {
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
        onchainAnalitics
      })

      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

      const onChainIdentifier = '5afe003861653435366632366138366164643038373864646561393238653366'

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
      chai.expect(deploymentTransaction.data.endsWith(onChainIdentifier)).to.be.true
    })
  })

  describe('Tracking Safe transactions on-chain via the transaction data field', () => {
    it('should append the on-chain identifier to the execTransaction data field', async () => {
      const onchainAnalitics: OnchainAnaliticsProps = {
        project: 'Test e2e Project',
        platform: 'Web'
      }

      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        onchainAnalitics
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

      const onChainIdentifier = '5afe003861653435366632366138366164643038373864646561393238653366'

      chai.expect(onChainIdentifier).to.equals(protocolKit.getOnchainIdentifier())
      chai.expect(transaction.input.endsWith(onChainIdentifier)).to.be.true
    })
  })
})
