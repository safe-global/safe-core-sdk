import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { SafeKitConfig } from './types'

/**
 * Initializes a Safe client with the given configuration options.
 * @param options - The SafeKit configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(options: SafeKitConfig) {
  const protocolKit = await getSafeProtocolKit(options)
  if (!protocolKit) throw new Error('Failed to create Safe client')

  await ensureSafeDeployment(protocolKit)

  return createClientInstance(protocolKit)
}

/**
 * Creates a client instance with a send method.
 * @param protocolKit - The protocolKit instance.
 * @returns An object with protocolKit and send method.
 */
function createClientInstance(protocolKit: Safe) {
  return {
    protocolKit,
    send: async (transactions: MetaTransactionData[]) => {
      const safeTransaction = await protocolKit.createTransaction({ transactions })
      const signedTransaction = await protocolKit.signTransaction(safeTransaction)
      await protocolKit.executeTransaction(signedTransaction)
    }
  }
}

/**
 * Retrieves the Safe protocol kit.
 * @param options - The configuration options.
 * @returns A protocolKit instance.
 */
async function getSafeProtocolKit(options: SafeKitConfig): Promise<Safe> {
  if (options.safeAddress) {
    return Safe.init({
      provider: options.provider,
      signer: options.signer,
      safeAddress: options.safeAddress
    })
  } else if (options.safeConfig) {
    return Safe.init({
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
  } else {
    throw new Error('Invalid configuration: either safeAddress or safeConfig must be provided.')
  }
}

/**
 * Ensures the Safe contract is deployed.
 * @param protocolKit - The protocolKit instance.
 */
async function ensureSafeDeployment(protocolKit: Safe) {
  if (await protocolKit.isSafeDeployed()) {
    // Perform any additional steps if Safe needs to be deployed
    console.warn('Safe is already deployed')
  }
}
