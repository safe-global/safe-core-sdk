import { ethers } from 'ethers'
import Safe, * as protocolKit from '@safe-global/protocol-kit'
import { Safe4337Pack } from './Safe4337Pack'
import dotenv from 'dotenv'
import {
  getAddModulesLibDeployment,
  getSafe4337ModuleDeployment
} from '@safe-global/safe-modules-deployments'
import { Safe4337InitOptions } from './types'
import * as constants from './constants'

dotenv.config()

let ethersAdapter: protocolKit.EthersAdapter
const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
const BUNDLER_URL = 'https://rpc.ankr.com/eth_sepolia'
const OWNER_1 = '0xFfAC5578BE8AC1B2B9D13b34cAf4A074B96B8A1b'
const SAFE_ADDRESS_v1_4_1 = '0x717f4BB83D8DF2e5a3Cc603Ee27263ac9EFB6c12'
const SAFE_ADDRESS_v1_3_0 = '0x8C35a08Af278518B59D04ddDe3F1b370aD766D22'
const PAYMASTER_ADDRESS = '0x0000000000325602a77416A16136FDafd04b299f'
const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const CHAIN_ID = '0xaa36a7'

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
        return CHAIN_ID
      }

      return undefined
    }
  })
}))

const createSafe4337Pack = async (
  initOptions: Partial<Safe4337InitOptions>
): Promise<Safe4337Pack> => {
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '0x', provider)
  ethersAdapter = new protocolKit.EthersAdapter({
    ethers,
    signerOrProvider: signer
  })

  const safe4337Pack = await Safe4337Pack.init({
    options: {
      safeAddress: ''
    },
    ...initOptions,
    ethersAdapter,
    rpcUrl: RPC_URL,
    bundlerUrl: BUNDLER_URL
  })

  return safe4337Pack
}

let safe4337ModuleAddress: string
let addModulesLibAddress: string

describe('Safe4337Pack', () => {
  beforeAll(async () => {
    const network = parseInt(CHAIN_ID).toString()
    safe4337ModuleAddress = getSafe4337ModuleDeployment({
      released: true,
      version: '0.2.0',
      network
    })?.networkAddresses[network] as string
    addModulesLibAddress = getAddModulesLibDeployment({
      released: true,
      version: '0.2.0',
      network
    })?.networkAddresses[network] as string
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When using existing Safe Accounts with version lesser than 1.4.1', () => {
    it('should throw an error if the Safe account version is not greater than 1.4.1', async () => {
      await expect(
        createSafe4337Pack({ options: { safeAddress: SAFE_ADDRESS_v1_3_0 } })
      ).rejects.toThrow(
        'Incompatibility detected: The current Safe Account version (1.3.0) is not supported. EIP-4337 requires the Safe to use at least v1.4.1.'
      )
    })
  })

  describe('When using existing Safe Accounts with version 1.4.1 or greater', () => {
    it('should be able to instantiate the pack using a existing Safe', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: { safeAddress: SAFE_ADDRESS_v1_4_1 }
      })

      expect(safe4337Pack).toBeInstanceOf(Safe4337Pack)
      expect(safe4337Pack.protocolKit).toBeInstanceOf(Safe)
      expect(await safe4337Pack.protocolKit.getAddress()).toBe(SAFE_ADDRESS_v1_4_1)
      expect(await safe4337Pack.getChainId()).toBe(CHAIN_ID)
    })

    it('should have the 4337 module enabled', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: { safeAddress: SAFE_ADDRESS_v1_4_1 }
      })

      expect(await safe4337Pack.protocolKit.getModules()).toEqual([safe4337ModuleAddress])
    })

    it('should detect if a custom 4337 module is not enabled in the Safe', async () => {
      await expect(
        createSafe4337Pack({
          customContracts: {
            safe4337ModuleAddress: '0xCustomModule'
          },
          options: {
            safeAddress: SAFE_ADDRESS_v1_4_1
          }
        })
      ).rejects.toThrow(
        'Incompatibility detected: The EIP-4337 module is not enabled in the provided Safe Account. Enable this module (address: 0xCustomModule) to add compatibility.'
      )
    })

    it('should use the 4337 module as the fallback handler', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: SAFE_ADDRESS_v1_4_1
        }
      })

      expect(await safe4337Pack.protocolKit.getFallbackHandler()).toEqual(safe4337ModuleAddress)
    })
  })

  describe('When the Safe Account does not exists', () => {
    it('should be able to instantiate the pack using a predicted Safe', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [OWNER_1],
          threshold: 1
        }
      })

      expect(await safe4337Pack.protocolKit.getAddress()).toBe(
        '0x65e0d294F2d17CB9fB0f65111E9Ac8a00C4049dA'
      )
    })

    it('should throw an error if the owners or threshold are not specified', async () => {
      await expect(
        createSafe4337Pack({
          // @ts-expect-error - An error will be thrown
          options: {
            threshold: 1
          }
        })
      ).rejects.toThrow('Owners and threshold are required to deploy a new Safe')

      await expect(
        createSafe4337Pack({
          // @ts-expect-error - An error will be thrown
          options: {
            owners: [OWNER_1]
          }
        })
      ).rejects.toThrow('Owners and threshold are required to deploy a new Safe')
    })

    it('should encode the enableModules transaction as deployment data', async () => {
      const encodeFunctionDataSpy = jest.spyOn(constants.INTERFACES, 'encodeFunctionData')
      const safeCreateSpy = jest.spyOn(Safe, 'create')

      await createSafe4337Pack({
        options: {
          owners: [OWNER_1],
          threshold: 1
        }
      })

      expect(encodeFunctionDataSpy).toHaveBeenCalledWith('enableModules', [[safe4337ModuleAddress]])
      expect(safeCreateSpy).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: constants.DEFAULT_SAFE_VERSION,
            saltNonce: undefined
          },
          safeAccountConfig: {
            owners: [OWNER_1],
            threshold: 1,
            to: addModulesLibAddress,
            data: constants.INTERFACES.encodeFunctionData('enableModules', [
              [safe4337ModuleAddress]
            ]),
            fallbackHandler: safe4337ModuleAddress,
            paymentToken: ethers.ZeroAddress,
            payment: 0,
            paymentReceiver: ethers.ZeroAddress
          }
        }
      })
    })

    it('should encode the enablesModule transaction together with a specific token approval in a multiSend call when trying to use a paymaster', async () => {
      const encodeFunctionDataSpy = jest.spyOn(constants.INTERFACES, 'encodeFunctionData')
      const safeCreateSpy = jest.spyOn(Safe, 'create')

      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [OWNER_1],
          threshold: 1
        },
        paymasterOptions: {
          paymasterAddress: PAYMASTER_ADDRESS,
          paymasterTokenAddress: PAYMASTER_TOKEN_ADDRESS
        }
      })

      const enableModulesData = constants.INTERFACES.encodeFunctionData('enableModules', [
        [safe4337ModuleAddress]
      ])
      const approveData = constants.INTERFACES.encodeFunctionData('approve', [
        PAYMASTER_ADDRESS,
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
      ])

      const multiSendData = protocolKit.encodeMultiSendData([
        { to: addModulesLibAddress, value: '0', data: enableModulesData, operation: 1 },
        { to: PAYMASTER_TOKEN_ADDRESS, value: '0', data: approveData, operation: 0 }
      ])

      expect(encodeFunctionDataSpy).toHaveBeenNthCalledWith(4, 'multiSend', [multiSendData])
      expect(safeCreateSpy).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: constants.DEFAULT_SAFE_VERSION,
            saltNonce: undefined
          },
          safeAccountConfig: {
            owners: [OWNER_1],
            threshold: 1,
            to: await safe4337Pack.protocolKit.getMultiSendAddress(),
            data: constants.INTERFACES.encodeFunctionData('multiSend', [multiSendData]),
            fallbackHandler: safe4337ModuleAddress,
            paymentToken: ethers.ZeroAddress,
            payment: 0,
            paymentReceiver: ethers.ZeroAddress
          }
        }
      })
    })
  })
})
