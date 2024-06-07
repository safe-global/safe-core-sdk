import dotenv from 'dotenv'
import { ethers } from 'ethers'
import Safe, * as protocolKit from '@safe-global/protocol-kit'
import {
  getAddModulesLibDeployment,
  getSafe4337ModuleDeployment
} from '@safe-global/safe-modules-deployments'
import { MetaTransactionData, OperationType } from '@safe-global/safe-core-sdk-types'
import { Safe4337Pack } from './Safe4337Pack'
import EthSafeOperation from './SafeOperation'
import * as constants from './constants'
import * as fixtures from './testing-utils/fixtures'
import { createSafe4337Pack, generateTransferCallData } from './testing-utils/helpers'
import * as utils from './utils'

dotenv.config()

const requestResponseMap = {
  [constants.RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS]: fixtures.ENTRYPOINTS,
  [constants.RPC_4337_CALLS.CHAIN_ID]: fixtures.CHAIN_ID,
  [constants.RPC_4337_CALLS.SEND_USER_OPERATION]: fixtures.USER_OPERATION_HASH,
  [constants.RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS]: fixtures.GAS_ESTIMATION,
  [constants.RPC_4337_CALLS.GET_USER_OPERATION_BY_HASH]: fixtures.USER_OPERATION_BY_HASH,
  [constants.RPC_4337_CALLS.GET_USER_OPERATION_RECEIPT]: fixtures.USER_OPERATION_RECEIPT,
  ['pimlico_getUserOperationGasPrice']: fixtures.USER_OPERATION_GAS_PRICE
}

const sendMock = jest.fn(async (method: string) => {
  return requestResponseMap[method]
})

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getEip4337BundlerProvider: jest.fn(() => ({ send: sendMock }))
}))

let safe4337ModuleAddress: string
let addModulesLibAddress: string

describe('Safe4337Pack', () => {
  beforeAll(async () => {
    const network = parseInt(fixtures.CHAIN_ID).toString()
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

  describe('4337 Safe validation', () => {
    it('should throw an error if the Safe version is not greater than 1.4.1', async () => {
      await expect(
        createSafe4337Pack({ options: { safeAddress: fixtures.SAFE_ADDRESS_v1_3_0 } })
      ).rejects.toThrow(
        'Incompatibility detected: The current Safe Account version (1.3.0) is not supported. EIP-4337 requires the Safe to use at least v1.4.1.'
      )
    })

    it('should throw an error if the 4337 Module is not enabled in the Safe account', async () => {
      await expect(
        createSafe4337Pack({
          options: { safeAddress: fixtures.SAFE_ADDRESS_4337_MODULE_NOT_ENABLED }
        })
      ).rejects.toThrow(
        'Incompatibility detected: The EIP-4337 module is not enabled in the provided Safe Account. Enable this module (address: 0xa581c4A4DB7175302464fF3C06380BC3270b4037) to add compatibility.'
      )
    })

    it('should throw an error if the 4337 fallbackhandler is not attached to the Safe account', async () => {
      await expect(
        createSafe4337Pack({
          options: { safeAddress: fixtures.SAFE_ADDRESS_4337_FALLBACKHANDLER_NOT_ENABLED }
        })
      ).rejects.toThrow(
        'Incompatibility detected: The EIP-4337 fallbackhandler is not attached to the Safe Account. Attach this fallbackhandler (address: 0xa581c4A4DB7175302464fF3C06380BC3270b4037) to ensure compatibility.'
      )
    })

    it('should throw an error if the Safe Modules do not match the supported version', async () => {
      await expect(
        createSafe4337Pack({
          safeModulesVersion: fixtures.SAFE_MODULES_V0_3_0
        })
      ).rejects.toThrow(
        'Incompatibility detected: Safe modules version 0.3.0 is not supported. The SDK can use 0.2.0 only.'
      )
    })
  })

  describe('When using existing Safe Accounts with version 1.4.1 or greater', () => {
    it('should throw an error if the version of the entrypoint used is incompatible', async () => {
      await expect(
        createSafe4337Pack({
          options: { safeAddress: fixtures.SAFE_ADDRESS_v1_4_1 },
          customContracts: { entryPointAddress: fixtures.ENTRYPOINTS[1] }
        })
      ).rejects.toThrow(
        `The selected entrypoint ${fixtures.ENTRYPOINTS[1]} is not compatible with version 0.2.0 of Safe modules`
      )
    })

    it('should throw an error if no supported entrypoints are available', async () => {
      const overridenMap = Object.assign({}, requestResponseMap, {
        [constants.RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS]: [fixtures.ENTRYPOINTS[1]]
      })

      const mockedUtils = jest.requireMock('./utils')
      mockedUtils.getEip4337BundlerProvider.mockImplementationOnce(() => ({
        send: jest.fn(async (method: string) => overridenMap[method])
      }))

      await expect(
        createSafe4337Pack({
          options: { safeAddress: fixtures.SAFE_ADDRESS_v1_4_1 }
        })
      ).rejects.toThrow(
        `Incompatibility detected: None of the entrypoints provided by the bundler is compatible with the Safe modules version 0.2.0`
      )
    })

    it('should be able to instantiate the pack using a existing Safe', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: { safeAddress: fixtures.SAFE_ADDRESS_v1_4_1 }
      })

      expect(safe4337Pack).toBeInstanceOf(Safe4337Pack)
      expect(safe4337Pack.protocolKit).toBeInstanceOf(Safe)
      expect(await safe4337Pack.protocolKit.getAddress()).toBe(fixtures.SAFE_ADDRESS_v1_4_1)
      expect(await safe4337Pack.getChainId()).toBe(fixtures.CHAIN_ID)
    })

    it('should have the 4337 module enabled', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: { safeAddress: fixtures.SAFE_ADDRESS_v1_4_1 }
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
            safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
          }
        })
      ).rejects.toThrow(
        'Incompatibility detected: The EIP-4337 module is not enabled in the provided Safe Account. Enable this module (address: 0xCustomModule) to add compatibility.'
      )
    })

    it('should use the 4337 module as the fallback handler', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
        }
      })

      expect(await safe4337Pack.protocolKit.getFallbackHandler()).toEqual(safe4337ModuleAddress)
    })
  })

  describe('When the Safe Account does not exists', () => {
    it('should be able to instantiate the pack using a predicted Safe', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [fixtures.OWNER_1],
          threshold: 1
        }
      })

      expect(await safe4337Pack.protocolKit.getAddress()).toBe(fixtures.PREDICTED_SAFE_ADDRESS)
    })

    it('should throw an error if the entrypoint is not compatible with the safe modules version', async () => {
      await expect(
        createSafe4337Pack({
          options: {
            owners: [fixtures.OWNER_1],
            threshold: 1
          },
          customContracts: { entryPointAddress: fixtures.ENTRYPOINTS[1] }
        })
      ).rejects.toThrow(
        `The selected entrypoint ${fixtures.ENTRYPOINTS[1]} is not compatible with version 0.2.0 of Safe modules`
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
            owners: [fixtures.OWNER_1]
          }
        })
      ).rejects.toThrow('Owners and threshold are required to deploy a new Safe')
    })

    it('should encode the enableModules transaction as deployment data', async () => {
      const encodeFunctionDataSpy = jest.spyOn(constants.INTERFACES, 'encodeFunctionData')
      const safeCreateSpy = jest.spyOn(Safe, 'init')

      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [fixtures.OWNER_1, fixtures.OWNER_2],
          threshold: 1
        }
      })

      expect(encodeFunctionDataSpy).toHaveBeenCalledWith('enableModules', [[safe4337ModuleAddress]])
      expect(safeCreateSpy).toHaveBeenCalledWith({
        provider: safe4337Pack.protocolKit.getSafeProvider().provider,
        signer: safe4337Pack.protocolKit.getSafeProvider().signer,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: constants.DEFAULT_SAFE_VERSION,
            saltNonce: undefined
          },
          safeAccountConfig: {
            owners: [fixtures.OWNER_1, fixtures.OWNER_2],
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
      const safeCreateSpy = jest.spyOn(Safe, 'init')

      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [fixtures.OWNER_1],
          threshold: 1
        },
        paymasterOptions: {
          paymasterAddress: fixtures.PAYMASTER_ADDRESS,
          paymasterTokenAddress: fixtures.PAYMASTER_TOKEN_ADDRESS
        }
      })

      const enableModulesData = constants.INTERFACES.encodeFunctionData('enableModules', [
        [safe4337ModuleAddress]
      ])
      const approveData = constants.INTERFACES.encodeFunctionData('approve', [
        fixtures.PAYMASTER_ADDRESS,
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
      ])

      const enable4337ModuleTransaction = {
        to: addModulesLibAddress,
        value: '0',
        data: enableModulesData,
        operation: OperationType.DelegateCall
      }

      const approveToPaymasterTransaction = {
        to: fixtures.PAYMASTER_TOKEN_ADDRESS,
        value: '0',
        data: approveData,
        operation: OperationType.Call
      }

      const multiSendData = protocolKit.encodeMultiSendData([
        enable4337ModuleTransaction,
        approveToPaymasterTransaction
      ])

      expect(encodeFunctionDataSpy).toHaveBeenNthCalledWith(4, 'multiSend', [multiSendData])
      expect(safeCreateSpy).toHaveBeenCalledWith({
        provider: safe4337Pack.protocolKit.getSafeProvider().provider,
        signer: safe4337Pack.protocolKit.getSafeProvider().signer,
        predictedSafe: {
          safeDeploymentConfig: {
            safeVersion: constants.DEFAULT_SAFE_VERSION,
            saltNonce: undefined
          },
          safeAccountConfig: {
            owners: [fixtures.OWNER_1],
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

  describe('When creating a new SafeOperation', () => {
    let safe4337Pack: Safe4337Pack
    let transferUSDC: MetaTransactionData

    beforeAll(async () => {
      safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
        }
      })

      transferUSDC = {
        to: fixtures.PAYMASTER_TOKEN_ADDRESS,
        data: generateTransferCallData(fixtures.SAFE_ADDRESS_v1_4_1, 100_000n),
        value: '0',
        operation: 0
      }
    })

    it('should allow to use a transaction batch', async () => {
      const transactions = [transferUSDC, transferUSDC]

      const safeOperation = await safe4337Pack.createTransaction({
        transactions
      })

      expect(safeOperation).toBeInstanceOf(EthSafeOperation)
      expect(safeOperation.data).toMatchObject({
        safe: fixtures.SAFE_ADDRESS_v1_4_1,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        initCode: '0x',
        paymasterAndData: '0x',
        callData: constants.INTERFACES.encodeFunctionData('executeUserOp', [
          await safe4337Pack.protocolKit.getMultiSendAddress(),
          '0',
          constants.INTERFACES.encodeFunctionData('multiSend', [
            protocolKit.encodeMultiSendData(transactions)
          ]),
          OperationType.DelegateCall
        ]),
        nonce: 1n,
        callGasLimit: 150000n,
        validAfter: 0,
        validUntil: 0,
        maxFeePerGas: 100000n,
        maxPriorityFeePerGas: 200000n,
        verificationGasLimit: 150000n,
        preVerificationGas: 100000n
      })
    })

    it('should allow to use a single transaction', async () => {
      const safeOperation = await safe4337Pack.createTransaction({
        transactions: [transferUSDC]
      })

      expect(safeOperation).toBeInstanceOf(EthSafeOperation)
      expect(safeOperation.data).toMatchObject({
        safe: fixtures.SAFE_ADDRESS_v1_4_1,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        initCode: '0x',
        paymasterAndData: '0x',
        callData: constants.INTERFACES.encodeFunctionData('executeUserOp', [
          transferUSDC.to,
          transferUSDC.value,
          transferUSDC.data,
          OperationType.Call
        ]),
        nonce: 1n,
        callGasLimit: 150000n,
        validAfter: 0,
        validUntil: 0,
        maxFeePerGas: 100000n,
        maxPriorityFeePerGas: 200000n,
        verificationGasLimit: 150000n,
        preVerificationGas: 100000n
      })
    })

    it('should fill the initCode property when the Safe does not exist', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          owners: [fixtures.OWNER_1],
          threshold: 1
        }
      })

      const getInitCodeSpy = jest.spyOn(safe4337Pack.protocolKit, 'getInitCode')

      const safeOperation = await safe4337Pack.createTransaction({
        transactions: [transferUSDC]
      })

      expect(getInitCodeSpy).toHaveBeenCalled()
      expect(safeOperation.data.initCode).toBe(
        '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec671688f0b900000000000000000000000029fcb43b46531bca003ddc8fcb67ffe91900c7620000000000000000000000000000000000000000000000000000000000000060ad27de2a410652abce96ea0fdfc30c2f0fd35952b78f554667111999a28ff33800000000000000000000000000000000000000000000000000000000000001e4b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000008ecd4ec46d4d2a6b64fe960b3d64e8b94b2234eb0000000000000000000000000000000000000000000000000000000000000140000000000000000000000000a581c4a4db7175302464ff3c06380bc3270b40370000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000ffac5578be8ac1b2b9d13b34caf4a074b96b8a1b00000000000000000000000000000000000000000000000000000000000000648d0dc49f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a581c4a4db7175302464ff3c06380bc3270b40370000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
    })

    it('should allow to create a sponsored transaction', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
        },
        paymasterOptions: {
          isSponsored: true,
          paymasterUrl: fixtures.PAYMASTER_URL,
          paymasterAddress: fixtures.PAYMASTER_ADDRESS
        }
      })

      const sponsoredSafeOperation = await safe4337Pack.createTransaction({
        transactions: [transferUSDC]
      })

      expect(sponsoredSafeOperation).toBeInstanceOf(EthSafeOperation)
      expect(sponsoredSafeOperation.data).toMatchObject({
        safe: fixtures.SAFE_ADDRESS_v1_4_1,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        initCode: '0x',
        paymasterAndData: '0x0000000000325602a77416A16136FDafd04b299f',
        callData: constants.INTERFACES.encodeFunctionData('executeUserOp', [
          transferUSDC.to,
          transferUSDC.value,
          transferUSDC.data,
          OperationType.Call
        ]),
        nonce: 1n,
        callGasLimit: 150000n,
        validAfter: 0,
        validUntil: 0,
        maxFeePerGas: 100000n,
        maxPriorityFeePerGas: 200000n,
        verificationGasLimit: 150000n,
        preVerificationGas: 100000n
      })
    })

    it('createTransaction should throw an error if paymasterUrl is not present in sponsored transactions', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
        },
        paymasterOptions: {
          isSponsored: true,
          paymasterAddress: fixtures.PAYMASTER_ADDRESS
        }
      })

      await expect(
        safe4337Pack.createTransaction({
          transactions: [transferUSDC]
        })
      ).rejects.toThrow('No paymaster url provided for a sponsored transaction')
    })

    it('should add the approve transaction to the batch when amountToApprove is provided', async () => {
      const safe4337Pack = await createSafe4337Pack({
        options: {
          safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
        },
        paymasterOptions: {
          paymasterTokenAddress: fixtures.PAYMASTER_TOKEN_ADDRESS,
          paymasterAddress: fixtures.PAYMASTER_ADDRESS
        }
      })

      const amountToApprove = 80_000n

      const sponsoredSafeOperation = await safe4337Pack.createTransaction({
        transactions: [transferUSDC],
        options: {
          amountToApprove
        }
      })

      const approveTransaction = {
        to: fixtures.PAYMASTER_TOKEN_ADDRESS,
        data: constants.INTERFACES.encodeFunctionData('approve', [
          fixtures.PAYMASTER_ADDRESS,
          amountToApprove
        ]),
        value: '0',
        operation: OperationType.Call // Call for approve
      }

      const batch = [transferUSDC, approveTransaction]

      expect(sponsoredSafeOperation).toBeInstanceOf(EthSafeOperation)
      expect(sponsoredSafeOperation.data).toMatchObject({
        safe: fixtures.SAFE_ADDRESS_v1_4_1,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        initCode: '0x',
        paymasterAndData: '0x0000000000325602a77416A16136FDafd04b299f',
        callData: constants.INTERFACES.encodeFunctionData('executeUserOp', [
          await safe4337Pack.protocolKit.getMultiSendAddress(),
          '0',
          constants.INTERFACES.encodeFunctionData('multiSend', [
            protocolKit.encodeMultiSendData(batch)
          ]),
          OperationType.DelegateCall
        ]),
        nonce: 1n,
        callGasLimit: 150000n,
        validAfter: 0,
        validUntil: 0,
        maxFeePerGas: 100000n,
        maxPriorityFeePerGas: 200000n,
        verificationGasLimit: 150000n,
        preVerificationGas: 100000n
      })
    })
  })

  it('should allow to sign a SafeOperation', async () => {
    const transferUSDC = {
      to: fixtures.PAYMASTER_TOKEN_ADDRESS,
      data: generateTransferCallData(fixtures.SAFE_ADDRESS_v1_4_1, 100_000n),
      value: '0',
      operation: 0
    }

    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    const safeOperation = await safe4337Pack.createTransaction({
      transactions: [transferUSDC]
    })

    expect(await safe4337Pack.signSafeOperation(safeOperation)).toMatchObject({
      signatures: new Map().set(
        fixtures.OWNER_1.toLowerCase(),
        new protocolKit.EthSafeSignature(
          fixtures.OWNER_1,
          '0x63de7fdf99bcf20a1981ae74c3960604139d8bf025da894abc11604b30f438e82ceb0d37e73bf16b0b8b896f8be82a49750433733c0414fe4a3b8182a3875e1f1c',
          false
        )
      )
    })
  })

  it('should allow to sign a SafeOperation using a SafeOperationResponse object from the api to add a signature', async () => {
    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    expect(await safe4337Pack.signSafeOperation(fixtures.SAFE_OPERATION_RESPONSE)).toMatchObject({
      signatures: new Map()
        .set(
          fixtures.OWNER_1.toLowerCase(),
          new protocolKit.EthSafeSignature(
            fixtures.OWNER_1,
            '0xcb28e74375889e400a4d8aca46b8c59e1cf8825e373c26fa99c2fd7c078080e64fe30eaf1125257bdfe0b358b5caef68aa0420478145f52decc8e74c979d43ab1c',
            false
          )
        )
        .set(
          fixtures.OWNER_2.toLowerCase(),
          new protocolKit.EthSafeSignature(
            fixtures.OWNER_2,
            '0xcb28e74375889e400a4d8aca46b8c59e1cf8825e373c26fa99c2fd7c078080e64fe30eaf1125257bdfe0b358b5caef68aa0420478145f52decc8e74c979d43ab1d',
            false
          )
        )
    })
  })

  it('should allow to send an UserOperation to a bundler', async () => {
    const transferUSDC = {
      to: fixtures.PAYMASTER_TOKEN_ADDRESS,
      data: generateTransferCallData(fixtures.SAFE_ADDRESS_v1_4_1, 100_000n),
      value: '0',
      operation: 0
    }

    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    let safeOperation = await safe4337Pack.createTransaction({
      transactions: [transferUSDC]
    })
    safeOperation = await safe4337Pack.signSafeOperation(safeOperation)

    await safe4337Pack.executeTransaction({ executable: safeOperation })

    expect(sendMock).toHaveBeenCalledWith(constants.RPC_4337_CALLS.SEND_USER_OPERATION, [
      utils.userOperationToHexValues(safeOperation.toUserOperation()),
      fixtures.ENTRYPOINTS[0]
    ])
  })

  it('should allow to send a UserOperation to the bundler using a SafeOperationResponse object from the api', async () => {
    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    await safe4337Pack.executeTransaction({ executable: fixtures.SAFE_OPERATION_RESPONSE })

    expect(sendMock).toHaveBeenCalledWith(constants.RPC_4337_CALLS.SEND_USER_OPERATION, [
      utils.userOperationToHexValues({
        sender: '0xE322e721bCe76cE7FCf3A475f139A9314571ad3D',
        nonce: '3',
        initCode: '0x',
        callData:
          '0x7bb37428000000000000000000000000e322e721bce76ce7fcf3a475f139a9314571ad3d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        callGasLimit: 122497n,
        verificationGasLimit: 123498n,
        preVerificationGas: 50705n,
        maxFeePerGas: 105183831060n,
        maxPriorityFeePerGas: 1380000000n,
        paymasterAndData: '0x',
        signature:
          '0x000000000000000000000000cb28e74375889e400a4d8aca46b8c59e1cf8825e373c26fa99c2fd7c078080e64fe30eaf1125257bdfe0b358b5caef68aa0420478145f52decc8e74c979d43ab1d'
      }),
      fixtures.ENTRYPOINTS[0]
    ])
  })

  it('should return a UserOperation based on a userOpHash', async () => {
    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    const { userOperation, entryPoint, transactionHash, blockHash, blockNumber } =
      await safe4337Pack.getUserOperationByHash(
        '0xee8e07f229d0ebf11c84a3e40f87e1d1b4c7b18eaeaebf3babb4b479424823e6'
      )

    expect(userOperation).toMatchObject({
      sender: '0x1405B3659a11a16459fc27Fa1925b60388C38Ce1',
      nonce: '0x1',
      initCode: '0x',
      callData:
        '0x7bb3742800000000000000000000000038869bf66a61cf6bdb996a6ae40d5853fd43b52600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001848d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000132001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0001c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d725e11588f040d86c4c49d8236e32a5868549f000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      callGasLimit: '0x1d7d0',
      verificationGasLimit: '0x14470',
      preVerificationGas: '0xbdb8',
      maxFeePerGas: '0x2d128cfa8c',
      maxPriorityFeePerGas: '0x52412100',
      paymasterAndData: '0x',
      signature:
        '0x000000000000000000000000a397ca32ee7fb5282256ee3465da0843485930b803d747516aac76e152f834051ac18fd2b3c0565590f9d65085538993c85c9bb189c940d15c15402c7c2885821b'
    })

    expect(blockHash).toBe('0x65f8249337ffede2067a006a96da47d3d3445ca72492a6a82afa02899f05d2e5')
    expect(blockNumber).toBe('0x5378b9')
    expect(entryPoint).toBe('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789')
    expect(transactionHash).toBe(
      '0xef262d20f68e4900aa6380b8ac0f66f9c00a7d988179fa177ad9c9758f0e380e'
    )
  })

  it('should return a UserOperation receipt based on a userOpHash', async () => {
    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    const userOperationReceipt = await safe4337Pack.getUserOperationReceipt(
      '0xee8e07f229d0ebf11c84a3e40f87e1d1b4c7b18eaeaebf3babb4b479424823e6'
    )

    expect(userOperationReceipt?.userOpHash).toBe(
      '0x3cb881d1969036174f38d636d22108d1d032145518b53104fc0b1e1296d2cc9c'
    )
    expect(userOperationReceipt?.sender).toBe('0x1405B3659a11a16459fc27Fa1925b60388C38Ce1')
    expect(userOperationReceipt?.actualGasUsed).toBe('0x27067')
    expect(userOperationReceipt?.actualGasCost).toBe('0x42f29418377167')
    expect(userOperationReceipt?.success).toBe(true)
    expect(userOperationReceipt?.logs).toStrictEqual([])

    expect(userOperationReceipt?.receipt).toMatchObject({
      transactionHash: '0xef262d20f68e4900aa6380b8ac0f66f9c00a7d988179fa177ad9c9758f0e380e',
      transactionIndex: '0x63',
      blockHash: '0x65f8249337ffede2067a006a96da47d3d3445ca72492a6a82afa02899f05d2e5',
      blockNumber: '0x5378b9',
      from: '0x4337001Fff419768e088Ce247456c1B892888084',
      to: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      cumulativeGasUsed: '0xc1a846',
      gasUsed: '0x25e6c',
      contractAddress: null,
      logs: [],
      logsBloom:
        '0x000000000000900000000000000000000000000000000000080000000002000000080000000000000402000100000000001000000000000080000200000100000000000000000000000000080000000000000000000000000000002000002000000000000a0000000000000000000800000000000000000000000010000200000000000060100000000000000040000000800000000000000008800000000000000000000000000000400000000000000200000000000000000002000000008000000002000100000001000000000000000000000020000000000000000020010040000000000020000010000008000200000000000000000000000000000000',
      status: '0x1',
      effectiveGasPrice: '0x1b67f3c201'
    })
  })

  it('should return an array of the entryPoint addresses supported by the client', async () => {
    const safe4337Pack = await createSafe4337Pack({
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1
      }
    })

    const supportedEntryPoints = await safe4337Pack.getSupportedEntryPoints()

    expect(supportedEntryPoints).toContain('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789')
  })
})
