import { AccountAbstractionConfig } from '@safe-global/account-abstraction-kit-poc/types'
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { RelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

class AccountAbstraction {
  #ethAdapter: EthersAdapter
  #signer: ethers.Signer
  #safeSdk?: Safe
  #relayPack?: RelayPack

  constructor(signer: ethers.Signer) {
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: this.#signer
    })
  }

  async init(options: AccountAbstractionConfig) {
    const { relayPack } = options
    this.setRelayPack(relayPack)

    const signer = await this.getSignerAddress()
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
  }

  setRelayPack(relayPack: RelayPack) {
    this.#relayPack = relayPack
  }

  async getSignerAddress(): Promise<string> {
    const signerAddress = await this.#signer.getAddress()
    return signerAddress
  }

  async getNonce(): Promise<number> {
    if (!this.#safeSdk) {
      throw new Error('SDK not initialized')
    }

    return this.#safeSdk.getNonce()
  }

  async getSafeAddress(): Promise<string> {
    if (!this.#safeSdk) {
      throw new Error('SDK not initialized')
    }

    return this.#safeSdk.getAddress()
  }

  async isSafeDeployed(): Promise<boolean> {
    if (!this.#safeSdk) {
      throw new Error('SDK not initialized')
    }

    return this.#safeSdk.isSafeDeployed()
  }

  async relayTransaction(
    transactions: MetaTransactionData[],
    options?: MetaTransactionOptions
  ): Promise<string> {
    if (!this.#relayPack || !this.#safeSdk) {
      throw new Error('SDK not initialized')
    }

    const relayedTransaction = await this.#relayPack.createRelayedTransaction({
      safe: this.#safeSdk,
      transactions,
      options
    })

    const signedSafeTransaction = await this.#safeSdk.signTransaction(relayedTransaction)

    const response = await this.#relayPack.executeRelayTransaction(
      signedSafeTransaction,
      this.#safeSdk
    )

    return response.taskId
  }
}

export default AccountAbstraction
