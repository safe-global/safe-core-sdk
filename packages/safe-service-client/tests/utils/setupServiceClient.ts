import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import SafeServiceClient from '../../src'
import config from './config'
import { getEthAdapter } from './setupEthAdapter'

interface ServiceClientConfig {
  serviceSdk: SafeServiceClient
  ethAdapter: EthAdapter
  signer: Wallet
}

export async function getServiceClient(signerPk: string): Promise<ServiceClientConfig> {
  const provider = getDefaultProvider(config.JSON_RPC)
  const signer = new Wallet(signerPk, provider)
  const ethAdapter = await getEthAdapter(signer)
  const serviceSdk = new SafeServiceClient({ txServiceUrl: config.BASE_URL, ethAdapter })
  return { serviceSdk, ethAdapter, signer }
}
