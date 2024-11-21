import { setupTests, safeVersionDeployed } from '@safe-global/testing-kit'
import semverSatisfies from 'semver/functions/satisfies'
import Safe, {
  getSafeContract,
  getSafeProxyFactoryContract,
  PredictedSafeProps,
  SafeAccountConfig,
  SafeProvider
} from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { getEip1193Provider } from './utils/setupProvider'
import { decodeFunctionData } from 'viem'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

chai.use(chaiAsPromised)

describe('On-chain analytics', () => {
  const provider = getEip1193Provider()

  describe('getTrackId method', () => {
    it('should return the correctly formatted track id when provided', async () => {
      const trackId = 'test-track-id'
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        trackId
      })

      const formattedTrackId = '0x7ba67a7e86c9fad9f51790e7e60307f882b9c492'

      chai.expect(formattedTrackId).to.equals(protocolKit.getTrackId())
    })

    it('should return an empty string when no track id is provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      chai.expect(protocolKit.getTrackId()).to.empty
    })
  })

  describe('Tracking Safe Deployment on Chain via paymentReceiver field in setup method', () => {
    it('should include the formatted trackId in the paymentReceiver field during Safe deployment', async () => {
      const trackId = 'test-track-id'

      const { chainId, accounts, contractNetworks } = await setupTests()
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
        trackId
      })

      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

      chai.expect(deploymentTransaction.data).to.include(protocolKit.getTrackId().replace('0x', ''))

      const customContracts = contractNetworks[chainId.toString()]

      const safeProvider = new SafeProvider({ provider })

      const proxyFactoryContract = await getSafeProxyFactoryContract({
        safeProvider,
        safeVersion: safeVersionDeployed,
        customContracts
      })

      proxyFactoryContract.contractAbi

      const decodedDataDeployment = decodeFunctionData({
        abi: proxyFactoryContract.contractAbi,
        data: deploymentTransaction.data as `0x${string}`
      })

      const initializer = decodedDataDeployment.args[1]

      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion: safeVersionDeployed,
        customContracts
      })

      if (semverSatisfies(safeVersionDeployed, '<=1.0.0')) {
        const decodedDataSetup = decodeFunctionData({
          abi: safeContract.contractAbi,
          data: initializer as `0x${string}`
        })

        const paymentReceiver = (decodedDataSetup.args[6] as string)?.toLowerCase()

        chai.expect(paymentReceiver).to.equals(protocolKit.getTrackId())
      } else {
        const decodedDataSetup = decodeFunctionData({
          abi: safeContract.contractAbi,
          data: initializer as `0x${string}`
        })

        const paymentReceiver = decodedDataSetup.args[7]?.toLowerCase()

        chai.expect(paymentReceiver).to.equals(protocolKit.getTrackId())
      }
    })

    it('should set the paymentReceiver to the zero address when no trackId is provided during Safe deployment', async () => {
      const { chainId, accounts, contractNetworks } = await setupTests()
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
        contractNetworks
      })

      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

      chai.expect(deploymentTransaction.data).to.include(protocolKit.getTrackId().replace('0x', ''))

      const customContracts = contractNetworks[chainId.toString()]

      const safeProvider = new SafeProvider({ provider })

      const proxyFactoryContract = await getSafeProxyFactoryContract({
        safeProvider,
        safeVersion: safeVersionDeployed,
        customContracts
      })

      proxyFactoryContract.contractAbi

      const decodedDataDeployment = decodeFunctionData({
        abi: proxyFactoryContract.contractAbi,
        data: deploymentTransaction.data as `0x${string}`
      })

      const initializer = decodedDataDeployment.args[1]

      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion: safeVersionDeployed,
        customContracts
      })

      if (semverSatisfies(safeVersionDeployed, '<=1.0.0')) {
        const decodedDataSetup = decodeFunctionData({
          abi: safeContract.contractAbi,
          data: initializer as `0x${string}`
        })

        const paymentReceiver = (decodedDataSetup.args[6] as string)?.toLowerCase()

        chai.expect(paymentReceiver).to.equals(ZERO_ADDRESS)
      } else {
        const decodedDataSetup = decodeFunctionData({
          abi: safeContract.contractAbi,
          data: initializer as `0x${string}`
        })

        const paymentReceiver = decodedDataSetup.args[7]?.toLowerCase()

        chai.expect(paymentReceiver).to.equals(ZERO_ADDRESS)
      }
    })
  })

  describe('Tracking Safe transactions on Chain via refundReceiver field in execTransaction method', () => {
    it('should include the formatted trackId in the refundReceiver field during the transaction execution', async () => {
      const trackId = 'test-track-id'
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        trackId
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

      const formattedTrackId = protocolKit.getTrackId()
      chai.expect(safeTransaction.data.refundReceiver).to.equals(formattedTrackId)
    })

    it('should set the refundReceiver to the zero address when no trackId is provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
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

      chai.expect(safeTransaction.data.refundReceiver).to.equals(ZERO_ADDRESS)
    })
  })
})
