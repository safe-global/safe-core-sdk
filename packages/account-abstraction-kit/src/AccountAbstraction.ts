import Safe, { SafeAccountConfig, predictSafeAddress } from '@safe-global/protocol-kit'
import { RelayKitBasePack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  EthAdapter
} from '@safe-global/safe-core-sdk-types'

class AccountAbstraction {
  safeSdk!: Safe
  relayPack?: RelayKitBasePack
  #ethAdapter: EthAdapter

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
      this.safeSdk = await Safe.create({ ethAdapter: this.#ethAdapter, safeAddress })
    } else {
      this.safeSdk = await Safe.create({
        ethAdapter: this.#ethAdapter,
        predictedSafe: { safeAccountConfig }
      })
    }

    return this.safeSdk
  }

  setRelayPack(relayPack: RelayKitBasePack) {
    this.relayPack = relayPack
  }

  async relayTransaction(
    transactions: MetaTransactionData[],
    options?: MetaTransactionOptions
  ): Promise<unknown> {
    if (!this.safeSdk) {
      throw new Error('SDK not initialized')
    }

    if (!this.relayPack) {
      throw new Error('Relay pack not initialized. Call setRelayPack(pack) first')
    }

    const relayedTransaction = await this.relayPack.createRelayedTransaction({
      transactions,
      options
    })

    const signedSafeTransaction = await this.safeSdk.signTransaction(relayedTransaction)

    return await this.relayPack.executeRelayTransaction(signedSafeTransaction)
  }
}

export default AccountAbstraction
