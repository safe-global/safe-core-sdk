import Safe, { predictSafeAddress } from '@safe-global/protocol-kit'
import { GelatoRelayPack, RelayKitBasePack } from '@safe-global/relay-kit'
import { EthAdapter, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import AccountAbstraction from './AccountAbstraction'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/relay-kit')

const GelatoRelayPackMock = GelatoRelayPack as jest.MockedClass<typeof GelatoRelayPack>
const predictSafeAddressMock = predictSafeAddress as jest.MockedFunction<typeof predictSafeAddress>
const SafeMock = Safe as jest.MockedClass<typeof Safe>

describe('AccountAbstraction', () => {
  const ethersAdapter = {
    getSignerAddress: jest.fn(),
    isContractDeployed: jest.fn(),
    getChainId: jest.fn()
  }
  const signerAddress = '0xSignerAddress'
  const predictSafeAddress = '0xPredictSafeAddressMock'

  beforeEach(() => {
    jest.clearAllMocks()
    ethersAdapter.getSignerAddress.mockResolvedValue(signerAddress)
    predictSafeAddressMock.mockResolvedValue(predictSafeAddress)
  })

  describe('init', () => {
    const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)

    it('should initialize a Safe instance with its address if contract is deployed already', async () => {
      ethersAdapter.isContractDeployed.mockResolvedValueOnce(true)

      await accountAbstraction.init()

      expect(ethersAdapter.getSignerAddress).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 }
      })
      expect(SafeMock.create).toHaveBeenCalledTimes(1)
      expect(SafeMock.create).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        safeAddress: predictSafeAddress
      })
    })

    it('should initialize a Safe instance with a config if contract is NOT deployed yet', async () => {
      ethersAdapter.isContractDeployed.mockResolvedValueOnce(false)

      await accountAbstraction.init()

      expect(ethersAdapter.getSignerAddress).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledTimes(1)
      expect(predictSafeAddressMock).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 }
      })
      expect(SafeMock.create).toHaveBeenCalledTimes(1)
      expect(SafeMock.create).toHaveBeenCalledWith({
        ethAdapter: ethersAdapter,
        predictedSafe: { safeAccountConfig: { owners: ['0xSignerAddress'], threshold: 1 } }
      })
    })

    it('should throw an error if the provider has not a signer', async () => {
      ethersAdapter.getSignerAddress.mockResolvedValueOnce(undefined)

      expect(accountAbstraction.init()).rejects.toThrow(
        `There's no signer in the provided EthAdapter`
      )
      expect(SafeMock.create).not.toHaveBeenCalled()
    })
  })

  describe('initialized', () => {
    const safeInstanceMock = {
      getAddress: jest.fn(),
      getNonce: jest.fn(),
      isSafeDeployed: jest.fn(),
      signTransaction: jest.fn()
    }

    const initAccountAbstraction = async () => {
      const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)
      await accountAbstraction.init()
      return accountAbstraction
    }

    let accountAbstraction: AccountAbstraction

    beforeEach(async () => {
      jest.clearAllMocks()
      SafeMock.create = () => Promise.resolve(safeInstanceMock as unknown as Safe)
      accountAbstraction = await initAccountAbstraction()
    })

    describe('getNonce', () => {
      const nonceMock = 123
      safeInstanceMock.getNonce.mockResolvedValueOnce(nonceMock)

      it('should return the nonce from the protocol-kit', async () => {
        const result = await accountAbstraction.protocolKit.getNonce()
        expect(result).toBe(nonceMock)
        expect(safeInstanceMock.getNonce).toHaveBeenCalledTimes(1)
      })

      it('should not be called if the protocol-kit is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)
        expect(accountAbstraction.protocolKit).toBe(undefined)
        expect(safeInstanceMock.getNonce).not.toHaveBeenCalled()
      })
    })

    describe('getSafeAddress', () => {
      const safeAddressMock = '0xSafeAddress'
      safeInstanceMock.getAddress.mockResolvedValueOnce(safeAddressMock)

      it('should return the Safe address from the protocol-kit', async () => {
        const result = await accountAbstraction.protocolKit.getAddress()
        expect(result).toBe(safeAddressMock)
        expect(safeInstanceMock.getAddress).toHaveBeenCalledTimes(1)
      })

      it('should not be called if the protocol-kit is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)
        expect(accountAbstraction.protocolKit).toBe(undefined)
        expect(safeInstanceMock.getAddress).not.toHaveBeenCalled()
      })
    })

    describe('isSafeDeployed', () => {
      it.each([true, false])('should return the value received from Safe SDK', async (expected) => {
        safeInstanceMock.isSafeDeployed.mockResolvedValueOnce(expected)
        const result = await accountAbstraction.protocolKit.isSafeDeployed()
        expect(result).toBe(expected)
        expect(safeInstanceMock.isSafeDeployed).toHaveBeenCalledTimes(1)
      })

      it('should not be called if the protocol-kit is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)
        expect(accountAbstraction.protocolKit).toBe(undefined)
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
        accountAbstraction.setRelayKit(
          new GelatoRelayPack({ protocolKit: accountAbstraction.protocolKit })
        )

        const result = await accountAbstraction.relayTransaction(transactionsMock, optionsMock)

        expect(result).toBe(relayResponseMock)

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).toHaveBeenCalledTimes(1)
        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).toHaveBeenCalledWith({
          transactions: transactionsMock,
          options: optionsMock
        })

        expect(safeInstanceMock.signTransaction).toHaveBeenCalledTimes(1)
        expect(safeInstanceMock.signTransaction).toHaveBeenCalledWith(safeTxMock)

        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).toHaveBeenCalledTimes(1)
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).toHaveBeenCalledWith(
          signedSafeTxMock,
          optionsMock
        )
      })

      it('should throw if the protocol-kit is not initialized', async () => {
        const accountAbstraction = new AccountAbstraction(ethersAdapter as unknown as EthAdapter)
        accountAbstraction.setRelayKit(
          new GelatoRelayPack({ protocolKit: accountAbstraction.protocolKit })
        )

        expect(accountAbstraction.relayTransaction(transactionsMock, optionsMock)).rejects.toThrow(
          'protocolKit not initialized. Call init() first'
        )

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).not.toHaveBeenCalled()
        expect(safeInstanceMock.signTransaction).not.toHaveBeenCalled()
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).not.toHaveBeenCalled()
      })

      it('should throw if relay-kit is not initialized', async () => {
        accountAbstraction.setRelayKit(undefined as unknown as RelayKitBasePack)

        expect(accountAbstraction.relayTransaction(transactionsMock, optionsMock)).rejects.toThrow(
          'relayKit not initialized. Call setRelayKit(pack) first'
        )

        expect(GelatoRelayPackMock.prototype.createRelayedTransaction).not.toHaveBeenCalled()
        expect(safeInstanceMock.signTransaction).not.toHaveBeenCalled()
        expect(GelatoRelayPackMock.prototype.executeRelayTransaction).not.toHaveBeenCalled()
      })
    })
  })
})
