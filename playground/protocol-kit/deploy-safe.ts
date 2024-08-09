import Safe, { SafeAccountConfig } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

// This file can be used to play around with the Safe Core SDK

interface Config {
  RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  DEPLOY_SAFE: {
    OWNERS: string[]
    THRESHOLD: number
    SALT_NONCE: string
    SAFE_VERSION: string
  }
}

const config: Config = {
  RPC_URL: 'https://rpc.sepolia.org',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_ADDRESS_PRIVATE_KEY>',
  DEPLOY_SAFE: {
    OWNERS: ['OWNER_ADDRESS'],
    THRESHOLD: 1, // <SAFE_THRESHOLD>
    SALT_NONCE: '150000',
    SAFE_VERSION: '1.3.0'
  }
}

async function main() {
  const safeVersion = config.DEPLOY_SAFE.SAFE_VERSION as SafeVersion

  console.log('safe config: ', config.DEPLOY_SAFE)

  // Config of the deployed Safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: config.DEPLOY_SAFE.OWNERS,
    threshold: config.DEPLOY_SAFE.THRESHOLD
  }

  const saltNonce = config.DEPLOY_SAFE.SALT_NONCE

  // Create SDK instance
  const safeSDK = await Safe.init({
    provider: config.RPC_URL,
    signer: config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    predictedSafe: {
      safeAccountConfig,
      safeDeploymentConfig: {
        saltNonce,
        safeVersion
      }
    }
  })

  // check if its deployed
  console.log('Safe Account deployed: ', await safeSDK.isSafeDeployed())

  // Predict deployed address
  const predictedSafeAddress = await safeSDK.getAddress()

  console.log('Predicted Safe address:', predictedSafeAddress)

  console.log('Deploying Safe Account...')

  // Deploy Safe
  const deployedSafeSDK = await safeSDK.deploy()

  console.log('Deployed Safe address:', await deployedSafeSDK.getAddress())

  // check if its deployed
  console.log('Safe Account deployed: ', await deployedSafeSDK.isSafeDeployed())
}

main()
