import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'

import { SafeKitConfig } from './types'

async function send(transactions: MetaTransactionData[]) {
  console.log('Sending transactions:', transactions)
}

export async function createSafeClient(options: SafeKitConfig) {
  let protocolKit

  if (options.safeAddress) {
    protocolKit = await Safe.init({
      provider: options.provider,
      signer: options.signer,
      safeAddress: options.safeAddress
    })
  } else {
    protocolKit = await Safe.init({
      provider: options.provider,
      signer: options.signer,
      predictedSafe: {
        safeAccountConfig: {
          owners: options.safeConfig.owners,
          threshold: options.safeConfig.threshold
        },
        safeDeploymentConfig: {
          saltNonce: options.safeConfig.saltNonce
        }
      }
    })
  }

  if (!protocolKit) {
    throw new Error('Failed to create Safe client')
  }

  if (await protocolKit.isSafeDeployed()) {
    // Deploy Safe
    // Return super clear error messages
  }

  return { send }
}
