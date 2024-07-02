import { PredictedSafeProps } from '@safe-global/protocol-kit'
import { GetSafeOperationListResponse } from '@safe-global/api-kit'
import {
  PaymasterOptions,
  Safe4337Pack,
  Safe4337CreateTransactionProps
} from '@safe-global/relay-kit'
import { SafeClient } from '../../SafeClient'
import { SafeOperationClient } from './SafeOperationClient'

import { SafeClientResult } from '../../types'
import { BundlerOptions } from './types'

/**
 * A function to extend the SafeClient with the ability to use a bundler.
 */
export function safeOperations(
  { bundlerUrl }: BundlerOptions,
  paymasterOptions?: PaymasterOptions
) {
  return async (client: SafeClient) => {
    const { provider, signer } = client.protocolKit.getSafeProvider()
    const isSafeDeployed = await client.protocolKit.isSafeDeployed()

    let options
    if (isSafeDeployed) {
      const safeAddress = await client.protocolKit.getAddress()

      options = {
        safeAddress
      }
    } else {
      const { safeDeploymentConfig, safeAccountConfig } =
        client.protocolKit.getPredictedSafe() as PredictedSafeProps

      options = {
        owners: safeAccountConfig.owners,
        threshold: safeAccountConfig.threshold,
        ...safeDeploymentConfig
      }
    }

    const safe4337Pack = await Safe4337Pack.init({
      provider,
      signer,
      bundlerUrl,
      options,
      paymasterOptions
    })

    client.protocolKit = safe4337Pack.protocolKit

    const safeOperationClient = new SafeOperationClient(safe4337Pack, client.apiKit)

    return {
      async sendSafeOperation({
        transactions,
        options = {}
      }: Safe4337CreateTransactionProps): Promise<SafeClientResult> {
        return safeOperationClient.sendSafeOperation({ transactions, options })
      },
      async confirmSafeOperation(userOperationHash: string): Promise<SafeClientResult> {
        return safeOperationClient.confirmSafeOperation(userOperationHash)
      },
      async getPendingSafeOperations(): Promise<GetSafeOperationListResponse> {
        return safeOperationClient.getPendingSafeOperations()
      }
    }
  }
}
