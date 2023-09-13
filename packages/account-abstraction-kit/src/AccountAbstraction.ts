import Safe, { SafeAccountConfig, predictSafeAddress } from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  EthAdapter
} from '@safe-global/safe-core-sdk-types'

class AccountAbstraction {
  #ethAdapter: EthAdapter
  #safeSdk!: Safe
  #relayPack?: RelayKitBasePack

  constructor(ethAdapter: EthAdapter) {
    this.#ethAdapter = ethAdapter
  }

  async init(): Promise<Safe> {
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
      this.#safeSdk = await Safe.create({ ethAdapter: this.#ethAdapter, safeAddress })
    } else {
      this.#safeSdk = await Safe.create({
        ethAdapter: this.#ethAdapter,
        predictedSafe: { safeAccountConfig }
      })
    }

    return this.#safeSdk
  }

  setRelayPack(relayPack: RelayKitBasePack) {
    this.#relayPack = relayPack
  }

  async relayTransaction(
    transactions: MetaTransactionData[],
    options?: MetaTransactionOptions
  ): Promise<unknown> {
    if (!this.#relayPack) {
      throw new Error('Relay is not initialized')
    }

    return await this.#relayPack.relayTransaction(transactions, options)
  }
}

export default AccountAbstraction
