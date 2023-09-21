import Safe, { SafeAccountConfig, predictSafeAddress } from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  EthAdapter
} from '@safe-global/safe-core-sdk-types'

/**
 * @class
 * This class helps to abstract the Account Abstraction logic required to interact with the Safe contracts using our Kits
 */
class AccountAbstraction {
  protocolKit!: Safe
  relayKit?: RelayKitBasePack
  #ethAdapter: EthAdapter

  /**
   * @constructor
   * @param ethAdapter The EthAdapter instance to be used by the Account Abstraction (e.g. EthersAdapter)
   */
  constructor(ethAdapter: EthAdapter) {
    this.#ethAdapter = ethAdapter
  }

  #initializeProtocolKit = async () => {
    const signer = await this.#ethAdapter.getSignerAddress()

    if (!signer) {
      throw new Error("There's no signer in the provided EthAdapter")
    }

    const owners = [signer]
    const threshold = 1

    const safeAccountConfig: SafeAccountConfig = {
      owners,
      threshold
    }

    const safeAddress = await predictSafeAddress({
      ethAdapter: this.#ethAdapter,
      safeAccountConfig
    })

    const isSafeDeployed = await this.#ethAdapter.isContractDeployed(safeAddress)

    if (isSafeDeployed) {
      this.protocolKit = await Safe.create({ ethAdapter: this.#ethAdapter, safeAddress })
    } else {
      this.protocolKit = await Safe.create({
        ethAdapter: this.#ethAdapter,
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

    return await this.relayKit.executeRelayTransaction(signedSafeTransaction)
  }
}

export default AccountAbstraction
