import { Signer } from '@ethersproject/abstract-signer'
import Safe, { EthersAdapter, predictSafeAddress } from '@safe-global/protocol-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { ethers } from 'ethers'
import AccountAbstraction from './AccountAbstraction'

jest.mock('@safe-global/protocol-kit')

const SafeMock = Safe as jest.MockedClass<typeof Safe>
const EthersAdapterMock = EthersAdapter as jest.MockedClass<typeof EthersAdapter>
const predictSafeAddressMock = predictSafeAddress as jest.MockedFunction<typeof predictSafeAddress>

describe('AccountAbstraction', () => {
  const signer = {
    provider: {},
    getAddress: jest.fn()
  }
  const signerAddress = '0xSignerAddress'
  const predictSafeAddress = '0xPredictSafeAddressMock'

  beforeEach(() => {
    jest.clearAllMocks()
    // Safe.create = mockSafeCreate
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
})
