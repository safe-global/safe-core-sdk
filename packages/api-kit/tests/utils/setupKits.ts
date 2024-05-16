import hre, { ethers } from 'hardhat'
import Web3 from 'web3'
import { custom, createWalletClient } from 'viem'

import Safe, { SafeProviderConfig, Eip1193Provider } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'

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

export function getEip1193Provider(): Eip1193Provider {
  switch (process.env.ETH_LIB) {
    case 'viem':
      const client = createWalletClient({
        transport: custom(hre.network.provider)
      })

      return { request: client.request } as Eip1193Provider

    case 'web3':
      const web3Provider = new Web3(hre.network.provider)

      return web3Provider.currentProvider as Eip1193Provider

    case 'ethers':
      const browserProvider = new ethers.BrowserProvider(hre.network.provider)

      return {
        request: async (request) => {
          return browserProvider.send(request.method, [...((request.params as unknown[]) ?? [])])
        }
      }
    default:
      throw new Error('ETH_LIB not set')
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
  const protocolKit = await Safe.init({ provider, signer, safeAddress })

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
