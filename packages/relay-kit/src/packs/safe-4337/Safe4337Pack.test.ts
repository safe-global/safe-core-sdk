import { ethers } from 'ethers'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { Safe4337Pack } from './Safe4337Pack'
import dotenv from 'dotenv'

dotenv.config()

let ethersAdapter: EthersAdapter
const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
const BUNDLER_URL = 'https://rpc.ankr.com/eth_sepolia'
// const OWNER_1 = '0xFfAC5578BE8AC1B2B9D13b34cAf4A074B96B8A1b'
const SAFE_ADDRESS_v1_4_1 = '0x717f4BB83D8DF2e5a3Cc603Ee27263ac9EFB6c12'
const SAFE_ADDRESS_v1_3_0 = '0x8C35a08Af278518B59D04ddDe3F1b370aD766D22'

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getEip4337BundlerProvider: () => ({
    send: async (method: string) => {
      if (method === 'eth_supportedEntryPoints') {
        return [
          '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
          '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
        ]
      }

      if (method === 'eth_chainId') {
        return '0xaa36a7'
      }

      return undefined
    }
  })
}))

describe('Safe4337Pack', () => {
  beforeAll(async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '0x', provider)
    ethersAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('When using Safe Accounts with version lesser than 1.4.1', () => {
    it('should throw an error if the Safe account version is not greater than 1.4.1', async () => {
      await expect(
        Safe4337Pack.init({
          ethersAdapter,
          rpcUrl: RPC_URL,
          bundlerUrl: BUNDLER_URL,
          options: {
            safeAddress: SAFE_ADDRESS_v1_3_0
          }
        })
      ).rejects.toThrow(
        'Incompatibility detected: The current Safe Account version (1.3.0) is not supported. EIP-4337 requires the Safe to use at least v1.4.1.'
      )
    })
  })

  describe('When using Safe Accounts with version 1.4.1 or greater', () => {
    it('should be able to instantiate the pack using a existing Safe', async () => {
      const safe4337Pack = await Safe4337Pack.init({
        ethersAdapter,
        rpcUrl: RPC_URL,
        bundlerUrl: BUNDLER_URL,
        options: {
          safeAddress: SAFE_ADDRESS_v1_4_1
        }
      })

      expect(safe4337Pack).toBeInstanceOf(Safe4337Pack)
      expect(safe4337Pack.protocolKit).toBeInstanceOf(Safe)
      expect(await safe4337Pack.protocolKit.getAddress()).toBe(SAFE_ADDRESS_v1_4_1)
      expect(await safe4337Pack.getChainId()).toBe('0xaa36a7')
    })
  })
})
