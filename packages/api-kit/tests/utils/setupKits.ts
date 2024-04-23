import Safe, { SafeProviderConfig, Eip1193Provider } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import { ethers, web3 } from 'hardhat'

import config from './config'

type GetKits = {
  protocolKit: Safe
  safeApiKit: SafeApiKit
}

type GetKitsOptions = {
  signer?: SafeProviderConfig['signer']
  txServiceUrl?: string
  safeAddress: string
}

function getEip1193Provider(): Eip1193Provider {
  switch (process.env.ETH_LIB) {
    case 'web3':
      return web3.currentProvider as Eip1193Provider
    case 'ethers':
      return {
        request: async (request) => {
          return ethers.provider.send(request.method, [...((request.params as unknown[]) ?? [])])
        }
      }
    default:
      throw new Error('Ethereum library not supported')
  }
}

export async function getProtocolKit({
  signer,
  safeAddress
}: {
  signer?: GetKitsOptions['signer']
  safeAddress: GetKitsOptions['safeAddress']
}): Promise<Safe> {
  const provider = getEip1193Provider()
  const protocolKit = await Safe.create({ provider, signer, safeAddress })

  return protocolKit
}

export function getApiKit(txServiceUrl?: GetKitsOptions['txServiceUrl']): SafeApiKit {
  const safeApiKit = new SafeApiKit({ chainId: config.CHAIN_ID, txServiceUrl })

  return safeApiKit
}

export async function getKits({
  signer,
  safeAddress,
  txServiceUrl
}: GetKitsOptions): Promise<GetKits> {
  const protocolKit = await getProtocolKit({ signer, safeAddress })
  const safeApiKit = getApiKit(txServiceUrl)

  return { protocolKit, safeApiKit }
}
