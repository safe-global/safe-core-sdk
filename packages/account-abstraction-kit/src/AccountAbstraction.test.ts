import { Signer } from '@ethersproject/abstract-signer'
import Safe, { EthersAdapter, predictSafeAddress } from '@safe-global/protocol-kit'
import { GelatoRelayPack, RelayPack } from '@safe-global/relay-kit'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'
import AccountAbstraction from './AccountAbstraction'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/relay-kit')

const EthersAdapterMock = EthersAdapter as jest.MockedClass<typeof EthersAdapter>
const GelatoRelayPackMock = GelatoRelayPack as jest.MockedClass<typeof GelatoRelayPack>
const predictSafeAddressMock = predictSafeAddress as jest.MockedFunction<typeof predictSafeAddress>
const SafeMock = Safe as jest.MockedClass<typeof Safe>

describe('AccountAbstraction', () => {
  const signer = {
    provider: {},
    getAddress: jest.fn()
  }
  const signerAddress = '0xSignerAddress'
  const predictSafeAddress = '0xPredictSafeAddressMock'

  beforeEach(() => {
    jest.clearAllMocks()
    signer.getAddress.mockResolvedValueOnce(signerAddress)
    predictSafeAddressMock.mockResolvedValueOnce(predictSafeAddress)
  })

  describe('constructor', () => {
    it('should create a new EthersAdapter instance', () => {
      new AccountAbstraction(signer as unknown as Signer)
      expect(EthersAdapterMock).toHaveBeenCalledTimes(1)
      expect(EthersAdapterMock).toHaveBeenCalledWith({ ethers, signerOrProvider: signer })
    })

    it('should throw an error if signer is not connected to a provider', () => {
      expect(
        () => new AccountAbstraction({ ...signer, provider: undefined } as unknown as Signer)
      ).toThrow('Signer must be connected to a provider')
      expect(EthersAdapterMock).not.toHaveBeenCalled()
    })
  })

  describe('init', () => {
    const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
    const relayPack = new GelatoRelayPack()

    it('should initialize a Safe instance with its address if contract is deployed already', async () => {
      EthersAdapterMock.prototype.isContractDeployed.mockResolvedValueOnce(true)

      await accountAbstraction.init({ relayPack })

      expect(signer.getAddress).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledWith({
        ethAdapter: expect.any(EthersAdapterMock),
        safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 }
      })
      expect(SafeMock.create).toHaveBeenCalledTimes(1)
      expect(SafeMock.create).toHaveBeenCalledWith({
        ethAdapter: expect.any(EthersAdapterMock),
        safeAddress: predictSafeAddress
      })
    })

    it('should initialize a Safe instance with a config if contract is NOT deployed yet', async () => {
      EthersAdapterMock.prototype.isContractDeployed.mockResolvedValueOnce(false)

      await accountAbstraction.init({ relayPack })

      expect(signer.getAddress).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledWith({
        ethAdapter: expect.any(EthersAdapterMock),
        safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 }
      })
      expect(SafeMock.create).toHaveBeenCalledTimes(1)
      expect(SafeMock.create).toHaveBeenCalledWith({
        ethAdapter: expect.any(EthersAdapterMock),
        predictedSafe: { safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 } }
      })
    })
  })

  describe('initialized', () => {
    const safeInstanceMock = {
      getAddress: jest.fn(),
      getNonce: jest.fn(),
      isSafeDeployed: jest.fn(),
      signTransaction: jest.fn()
    }

    const initAccountAbstraction = async (initOptions = { relayPack: new GelatoRelayPack() }) => {
      const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
      await accountAbstraction.init(initOptions)
      return accountAbstraction
    }

    let accountAbstraction: AccountAbstraction

    beforeEach(async () => {
      accountAbstraction = await initAccountAbstraction()
      jest.clearAllMocks()
      SafeMock.create = () => Promise.resolve(safeInstanceMock as unknown as Safe)
    })

    describe('getSignerAddress', () => {
      it("should return the signer's address", async () => {
        const result = await accountAbstraction.getSignerAddress()
        expect(result).toBe(signerAddress)
        expect(signer.getAddress).toHaveBeenCalledTimes(1)
      })
    })

    describe('getNonce', () => {
      const nonceMock = 123
      safeInstanceMock.getNonce.mockResolvedValueOnce(nonceMock)

      it('should return the nonce received from Safe SDK', async () => {
        const result = await accountAbstraction.getNonce()
        expect(result).toBe(nonceMock)
        expect(safeInstanceMock.getNonce).toHaveBeenCalledTimes(1)
      })

      it('should throw if Safe SDK is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
        expect(accountAbstraction.getNonce()).rejects.toThrow('SDK not initialized')
        expect(safeInstanceMock.getNonce).not.toHaveBeenCalled()
      })
    })

    describe('getSafeAddress', () => {
      const safeAddressMock = '0xSafeAddress'
      safeInstanceMock.getAddress.mockResolvedValueOnce(safeAddressMock)

      it('should return the address received from Safe SDK', async () => {
        const result = await accountAbstraction.getSafeAddress()
        expect(result).toBe(safeAddressMock)
        expect(safeInstanceMock.getAddress).toHaveBeenCalledTimes(1)
      })

      it('should throw if Safe SDK is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
        expect(accountAbstraction.getSafeAddress()).rejects.toThrow('SDK not initialized')
        expect(safeInstanceMock.getAddress).not.toHaveBeenCalled()
      })
    })

    describe('isSafeDeployed', () => {
      it.each([true, false])('should return the value received from Safe SDK', async (expected) => {
        safeInstanceMock.isSafeDeployed.mockResolvedValueOnce(expected)
        const result = await accountAbstraction.isSafeDeployed()
        expect(result).toBe(expected)
        expect(safeInstanceMock.isSafeDeployed).toHaveBeenCalledTimes(1)
      })

      it('should throw if Safe SDK is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
        expect(accountAbstraction.isSafeDeployed()).rejects.toThrow('SDK not initialized')
        expect(safeInstanceMock.isSafeDeployed).not.toHaveBeenCalled()
      })
    })

    describe('relayTransaction', () => {
      const transactionsMock = [{ to: '0xToAddress', value: '0.1', data: '0xData' }]
      const optionsMock = { isSponsored: true }
      const safeTxMock = { data: { foo: 'bar' } } as unknown as SafeTransaction
      const signedSafeTxMock = { ...safeTxMock, signed: true } as unknown as SafeTransaction
      const relayResponseMock = { taskId: '0xTaskID' }

      it('should return the Gelato taskId of the relayed transaction', async () => {
        GelatoRelayPackMock.prototype.createRelayedTransaction.mockResolvedValueOnce(safeTxMock)
        safeInstanceMock.signTransaction.mockResolvedValueOnce(signedSafeTxMock)
        GelatoRelayPackMock.prototype.executeRelayTransaction.mockResolvedValueOnce(
          relayResponseMock
        )

        const result = await accountAbstraction.relayTransaction(transactionsMock, optionsMock)

        expect(result).toBe(relayResponseMock.taskId)

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).toHaveBeenCalledTimes(1)
        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).toHaveBeenCalledWith({
          safe: safeInstanceMock,
          transactions: transactionsMock,
          options: optionsMock
        })

        expect(safeInstanceMock.signTransaction).toHaveBeenCalledTimes(1)
        expect(safeInstanceMock.signTransaction).toHaveBeenCalledWith(safeTxMock)

        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).toHaveBeenCalledTimes(1)
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).toHaveBeenCalledWith(
          signedSafeTxMock,
          safeInstanceMock,
          optionsMock
        )
      })

      it('should throw if Safe SDK is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(signer as unknown as Signer)
        accountAbstraction.setRelayPack(new GelatoRelayPack())

        expect(accountAbstraction.relayTransaction(transactionsMock, optionsMock)).rejects.toThrow(
          'SDK not initialized'
        )

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).not.toHaveBeenCalled()
        expect(safeInstanceMock.signTransaction).not.toHaveBeenCalled()
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).not.toHaveBeenCalled()
      })

      it('should throw if Relay pack is not initialized', async () => {
        const accountAbstraction = await initAccountAbstraction()
        accountAbstraction.setRelayPack(undefined as unknown as RelayPack)

        expect(accountAbstraction.relayTransaction(transactionsMock, optionsMock)).rejects.toThrow(
          'SDK not initialized'
        )

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).not.toHaveBeenCalled()
        expect(safeInstanceMock.signTransaction).not.toHaveBeenCalled()
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).not.toHaveBeenCalled()
      })
    })
  })
})
