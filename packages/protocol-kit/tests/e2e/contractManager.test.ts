import {
  safeVersionDeployed,
  setupTests,
  getCompatibilityFallbackHandler,
  getCreateCall,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSignMessageLib,
  getSimulateTxAccessor
} from '@safe-global/testing-kit'
import Safe, { ContractNetworksConfig, PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

describe('Safe contracts manager', () => {
  const provider = getEip1193Provider()

  describe('create', async () => {
    it('should initialize the SDK with a Safe that is not deployed', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig: {
          owners: [accounts[0].address],
          threshold: 1
        },
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }
      chai.expect(
        await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
      ).not.to.be.undefined
    })

    it('should fail if the current network is not a default network and no contractNetworks is provided', async () => {
      const { safe } = await setupTests()
      const safeAddress = safe.address
      await chai
        .expect(
          Safe.init({
            provider,
            safeAddress
          })
        )
        .to.be.rejectedWith('Invalid multiSend contract address')
    })

    it('should fail if SafeProxy contract is not deployed on the current network', async () => {
      const { contractNetworks } = await setupTests()
      await chai
        .expect(
          Safe.init({
            provider,
            safeAddress: ZERO_ADDRESS,
            contractNetworks
          })
        )
        .to.be.rejectedWith('SafeProxy contract is not deployed on the current network')
    })

    it('should fail if MultiSend contract is specified in contractNetworks but not deployed', async () => {
      const { safe, chainId } = await setupTests()
      const customContractNetworks = {
        [chainId.toString()]: {
          safeSingletonAddress: ZERO_ADDRESS,
          safeSingletonAbi: (await getSafeSingleton()).abi,
          safeProxyFactoryAddress: ZERO_ADDRESS,
          safeProxyFactoryAbi: (await getFactory()).abi,
          multiSendAddress: ZERO_ADDRESS,
          multiSendAbi: (await getMultiSend()).abi,
          multiSendCallOnlyAddress: ZERO_ADDRESS,
          multiSendCallOnlyAbi: (await getMultiSendCallOnly()).abi,
          fallbackHandlerAddress: ZERO_ADDRESS,
          fallbackHandlerAbi: (await getCompatibilityFallbackHandler()).abi,
          signMessageLibAddress: ZERO_ADDRESS,
          signMessageLibAbi: (await getSignMessageLib()).abi,
          createCallAddress: ZERO_ADDRESS,
          createCallAbi: (await getCreateCall()).abi,
          simulateTxAccessorAddress: ZERO_ADDRESS,
          simulateTxAccessorAbi: (await getSimulateTxAccessor()).abi
        }
      }

      const safeAddress = safe.address
      await chai
        .expect(
          Safe.init({
            provider,
            safeAddress,
            contractNetworks: customContractNetworks as ContractNetworksConfig
          })
        )
        .to.be.rejectedWith('MultiSend contract is not deployed on the current network')
    })

    it('should set the MultiSend contract available on the current network', async () => {
      const { safe, chainId, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai
        .expect(await safeSdk.getMultiSendAddress())
        .to.be.eq(contractNetworks[chainId.toString()].multiSendAddress)
    })
  })
})
