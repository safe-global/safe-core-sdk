import hre from 'hardhat'
import dotenv from 'dotenv'
import { BrowserProvider } from 'ethers'
import { custom, createWalletClient } from 'viem'

import Safe, { SafeProviderConfig, Eip1193Provider } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'

import path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

type GetKits = {
  protocolKit: Safe
  safeApiKit: SafeApiKit
}

type GetKitsOptions = {
  signer?: SafeProviderConfig['signer']
  safeAddress: string
}

export function getEip1193Provider(): Eip1193Provider {
  switch (process.env.ETH_LIB) {
    case 'viem':
      const client = createWalletClient({
        transport: custom(hre.network.provider)
      })

      return { request: client.request } as Eip1193Provider

    case 'ethers':
      const browserProvider = new BrowserProvider(hre.network.provider)

      return {
        request: async (request) => {
          return browserProvider.send(request.method, [...((request.params as unknown[]) ?? [])])
        }
      }
    default:
      throw new Error('ETH_LIB not set')
  }
}

export async function getProtocolKit({ signer, safeAddress }: GetKitsOptions): Promise<Safe> {
  const provider = getEip1193Provider()
  const protocolKit = await Safe.init({ provider, signer, safeAddress })

  return protocolKit
}

export function getApiKit(): SafeApiKit {
  return new SafeApiKit({ apiKey: process.env.API_KEY || 'jwt-token' })
}

export async function getKits({ signer, safeAddress }: GetKitsOptions): Promise<GetKits> {
  const protocolKit = await getProtocolKit({ signer, safeAddress })
  const safeApiKit = getApiKit()

  return { protocolKit, safeApiKit }
}
