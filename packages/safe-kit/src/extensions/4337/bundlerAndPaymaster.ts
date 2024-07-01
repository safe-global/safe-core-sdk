import { SafeMessageListResponse } from '@safe-global/api-kit'
import { PaymasterOptions, Safe4337Pack, UserOperation } from '@safe-global/relay-kit'
import { SafeClient } from '../../SafeClient'

import { SafeClientResult } from '../../types'
import { PredictedSafeProps } from 'packages/protocol-kit/dist/src'
import { SafeUserOperationClient } from './SafeUserOperationClient'

/**
 * A function to extend the SafeClient with the ability to use a bundler.
 */
export function bundlerAndPaymaster(bundlerUrl: string, paymasterOptions: PaymasterOptions) {
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

    const safeUserOperationClient = new SafeUserOperationClient(safe4337Pack, client.apiKit)

    return {
      async sendUserOperation(userOperation: UserOperation) {
        return safeUserOperationClient.sendUserOperation(userOperation)
      },
      async confirmUserOperation(userOperationHash: string): Promise<SafeClientResult> {
        return safeUserOperationClient.confirmUserOperation(userOperationHash)
      },
      async getPendingUserOperations(): Promise<SafeMessageListResponse> {
        return safeUserOperationClient.getPendingUserOperations()
      }
    }
  }
}
