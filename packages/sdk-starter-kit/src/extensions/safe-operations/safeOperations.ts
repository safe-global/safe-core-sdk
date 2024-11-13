import { PredictedSafeProps } from '@safe-global/protocol-kit'
import { GetSafeOperationListResponse, ListOptions } from '@safe-global/api-kit'
import { PaymasterOptions, Safe4337Pack } from '@safe-global/relay-kit'

import { SafeClient } from '@safe-global/sdk-starter-kit/SafeClient'
import { SafeOperationClient } from '@safe-global/sdk-starter-kit/extensions/safe-operations/SafeOperationClient'
import {
  ConfirmSafeOperationProps,
  SafeClientResult,
  SendSafeOperationProps
} from '@safe-global/sdk-starter-kit/types'

export type BundlerOptions = {
  bundlerUrl: string
}

/**
 * Extend the SafeClient with the ability to use a bundler and a paymaster
 *
 * @example
 * const safeClient = await createSafeClient({ ... })
 *
 * const safeOperationClient = await safeClient.extend(
 *   safeOperations({ ... }, { ... })
 * )
 *
 * const { safeOperations } = await safeOperationClient.sendSafeOperation({ transactions })
 * await safeOperationClient.confirmSafeOperation({ safeOperationHash: safeOperations?.safeOperationHash})
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
      /**
       * Send SafeOperations from a group of transactions.
       * This method will convert your transactions in a batch and:
       * - If the threshold > 1 it will save for later the SafeOperation using the Transaction service
       *   You must confirmSafeOperation() with other owners
       * - If the threshold = 1 the SafeOperation can be submitted to the bundler so it will execute it immediately
       *
       * @param {Safe4337CreateTransactionProps} props The Safe4337CreateTransactionProps object
       * @returns {Promise<SafeClientResult>} A promise that resolves with the status of the SafeOperation
       */
      async sendSafeOperation(props: SendSafeOperationProps): Promise<SafeClientResult> {
        return safeOperationClient.sendSafeOperation(props)
      },
      /**
       * Confirms the stored safeOperation
       *
       * @param {ConfirmSafeOperationProps} props The ConfirmSafeOperationProps object
       * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the safeOperation.
       */
      async confirmSafeOperation(props: ConfirmSafeOperationProps): Promise<SafeClientResult> {
        return safeOperationClient.confirmSafeOperation(props)
      },
      /**
       * Retrieves the pending Safe operations for the current Safe account
       *
       * @async
       * @param {ListOptions} options The pagination options
       * @returns {Promise<GetSafeOperationListResponse>} A promise that resolves to an array of pending Safe operations.
       * @throws {Error} If there is an issue retrieving the safe address or pending Safe operations.
       */
      async getPendingSafeOperations(options?: ListOptions): Promise<GetSafeOperationListResponse> {
        return safeOperationClient.getPendingSafeOperations(options)
      }
    }
  }
}
