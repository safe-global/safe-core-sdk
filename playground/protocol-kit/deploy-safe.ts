import { SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit'
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
  RPC_URL: 'https://sepolia.gateway.tenderly.co',
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

  // Create SafeFactory instance
  const safeFactory = await SafeFactory.init({
    provider: config.RPC_URL,
    signer: config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    safeVersion
  })

  // Config of the deployed Safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: config.DEPLOY_SAFE.OWNERS,
    threshold: config.DEPLOY_SAFE.THRESHOLD
  }
  const saltNonce = config.DEPLOY_SAFE.SALT_NONCE

  // Predict deployed address
  const predictedDeploySafeAddress = await safeFactory.predictSafeAddress(
    safeAccountConfig,
    saltNonce
  )

  console.log('Predicted deployed Safe address:', predictedDeploySafeAddress)

  function callback(txHash: string) {
    console.log('Transaction hash:', txHash)
  }

  // Deploy Safe
  const safe = await safeFactory.deploySafe({
    safeAccountConfig,
    saltNonce,
    callback
  })

  console.log('Deployed Safe:', await safe.getAddress())
}

main()
