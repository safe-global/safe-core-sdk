import { WalletClient, Account } from 'viem'
import { createSafeClient } from '@safe-global/safe-kit/index'
import {
  ExistingSafeKitConfig,
  PredictedSafeKitConfig,
  SendTransactionProps,
  ConfirmTransactionProps
} from '@safe-global/safe-kit/types'
import { SafeClient } from '@safe-global/safe-kit/SafeClient'

export const safeActions =
  (safeConfig: ExistingSafeKitConfig | PredictedSafeKitConfig) => (client: WalletClient) => {
    let safeClient: SafeClient

    console.log('-Safe config:', safeConfig)

    const eip1193Provider = {
      request: async (args: any) => {
        if (args.method === 'eth_requestAccounts') {
          return client.requestAddresses()
        }

        if (args.method === 'eth_accounts') {
          return client.getAddresses()
        }

        if (args.method === 'eth_signTypedData_v4') {
          return client.signTypedData(JSON.parse(args.params[1]))
        }

        if (args.method === 'eth_sendTransaction') {
          const tx = args.params[0] as any

          return client.sendTransaction({
            account: client.account as Account,
            chain: client.chain,
            to: tx?.to || '0x',
            value: tx?.value,
            data: tx?.data
          })
        }

        return client.request(args)
      }
    }

    async function getSafeClient() {
      if (safeClient) return safeClient

      const signerAddress = (await client.getAddresses())[0] as string

      return createSafeClient({
        provider: eip1193Provider,
        signer: signerAddress,
        ...(safeConfig.safeAddress
          ? { safeAddress: safeConfig.safeAddress }
          : { safeOptions: safeConfig.safeOptions })
      })
    }

    return {
      getAddress: async () => {
        const safeClient = await getSafeClient()
        return safeClient.protocolKit.getAddress()
      },
      isSafeDeployed: async () => {
        const safeClient = await getSafeClient()
        return safeClient.protocolKit.isSafeDeployed()
      },

      sendSafeTransaction: async (props: SendTransactionProps) => {
        const safeClient = await getSafeClient()
        return safeClient.send(props)
      },

      confirmSafeTransaction: async (props: ConfirmTransactionProps) => {
        const safeClient = await getSafeClient()
        return safeClient.confirm(props)
      },

      getPendingTransactions: async () => {
        const safeClient = await getSafeClient()
        return safeClient.getPendingTransactions()
      }
    }
  }
