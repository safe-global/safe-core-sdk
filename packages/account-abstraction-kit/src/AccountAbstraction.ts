import Safe, {
  SafeAccountConfig,
  predictSafeAddress,
  SafeProvider,
  HexAddress,
  HttpTransport,
  PrivateKey,
  SocketTransport,
  SafeProviderConfig,
  Eip1193Provider
} from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

/**
 * @class
 * This class helps to abstract the Account Abstraction logic required to interact with the Safe contracts using our Kits
 */
class AccountAbstraction {
  protocolKit!: Safe
  relayKit?: RelayKitBasePack
  #provider: Eip1193Provider | HttpTransport | SocketTransport
  #signer?: HexAddress | PrivateKey

  /**
   * @constructor
   * @param config  The SafeProviderConfig
   */
  constructor({ provider, signer }: SafeProviderConfig) {
    this.#provider = provider
    this.#signer = signer
  }

  #initializeProtocolKit = async () => {
    const safeProvider = new SafeProvider({ provider: this.#provider, signer: this.#signer })
    const signer = await safeProvider.getSignerAddress()

    if (!signer) {
      throw new Error("There's no signer in the provided SafeProvider")
    }

    const owners = [signer]
    const threshold = 1

    const safeAccountConfig: SafeAccountConfig = {
      owners,
      threshold
    }

    const safeAddress = await predictSafeAddress({
      safeProvider,
      chainId: await safeProvider.getChainId(),
      safeAccountConfig
    })

    const isSafeDeployed = await safeProvider.isContractDeployed(safeAddress)

    if (isSafeDeployed) {
      this.protocolKit = await Safe.create({ provider: this.#provider, safeAddress })
    } else {
      this.protocolKit = await Safe.create({
        provider: this.#provider,
        predictedSafe: { safeAccountConfig }
      })
    }
  }

  /**
   * Initialize the AccountAbstraction instance with the safe address or the predicted safe address
   * The current implementation only works for a single owner Safe with threshold 1. This will be improved in the future
   */
  async init() {
    await this.#initializeProtocolKit()
  }

  /**
   * Use this method to set the Relay Pack instance to be used by the AccountAbstraction instance
   * It's mandatory to set the instance before using the relayTransaction() method
   * @param relayPack The RelayPack instance to be used by the AccountAbstraction instance (e.g. GelatoRelayPack)
   */
  setRelayKit(relayPack: RelayKitBasePack) {
    this.relayKit = relayPack
  }

  /**
   * Use this method to relay a transaction using the Relay Pack instance set in the AccountAbstraction instance
   * @param transactions The list of transactions to be relayed
   * @param options The transaction options
   * @returns The result of the relay transaction execution (e.g. taskId in the case of Gelato)
   */
  async relayTransaction(
    transactions: MetaTransactionData[],
    options?: MetaTransactionOptions
  ): Promise<unknown> {
    if (!this.protocolKit) {
      throw new Error('protocolKit not initialized. Call init() first')
    }

    if (!this.relayKit) {
      throw new Error('relayKit not initialized. Call setRelayKit(pack) first')
    }

    const relayedTransaction = await this.relayKit.createRelayedTransaction({
      transactions,
      options
    })

    const signedSafeTransaction = await this.protocolKit.signTransaction(relayedTransaction)

    return await this.relayKit.executeRelayTransaction(signedSafeTransaction, options)
  }
}

export default AccountAbstraction
