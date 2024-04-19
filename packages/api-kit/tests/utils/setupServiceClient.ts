import { getDefaultProvider, Wallet } from 'ethers'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getEip1193Provider } from '../utils/setupProvider'
import { Eip1193Provider } from '@safe-global/protocol-kit/types'

interface ServiceClientConfig {
  safeApiKit: SafeApiKit
  provider: Eip1193Provider
  signer: Wallet
}

export async function getServiceClient(
  signerPk: string,
  txServiceUrl?: string
): Promise<ServiceClientConfig> {
  const signer = new Wallet(signerPk, getDefaultProvider(config.JSON_RPC))
  const provider = getEip1193Provider()
  const safeApiKit = new SafeApiKit({ chainId: config.CHAIN_ID, txServiceUrl })

  return { safeApiKit, provider, signer }
}
