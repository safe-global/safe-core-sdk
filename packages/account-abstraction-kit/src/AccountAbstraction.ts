import {
  AccountAbstractionConfig,
  OperationType
} from '@safe-global/account-abstraction-kit-poc/types'
import Safe, {
  DEFAULT_SAFE_VERSION,
  EthersAdapter,
  PREDETERMINED_SALT_NONCE,
  PredictedSafeProps,
  SafeAccountConfig,
  SafeDeploymentConfig,
  encodeCreateProxyWithNonce,
  encodeMultiSendData,
  encodeSetupCallData,
  getMultiSendCallOnlyContract,
  getProxyFactoryContract,
  getSafeContract,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { RelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeProxyFactoryContract,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

const safeVersion: SafeVersion = DEFAULT_SAFE_VERSION

class AccountAbstraction {
  #ethAdapter: EthersAdapter
  #signer: ethers.Signer
  #safeSdk?: Safe
  #safeProxyFactoryContract?: SafeProxyFactoryContract
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
    const saltNonce = PREDETERMINED_SALT_NONCE

    const safeAccountConfig: SafeAccountConfig = {
      owners,
      threshold
    }
    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce,
      safeVersion
    }

    this.#safeProxyFactoryContract = await getProxyFactoryContract({
      ethAdapter: this.#ethAdapter,
      safeVersion
    })

    const safeAddress = await predictSafeAddress({
      ethAdapter: this.#ethAdapter,
      safeAccountConfig,
      safeDeploymentConfig
    })

    try {
      await getSafeContract({
        ethAdapter: this.#ethAdapter,
        safeVersion,
        customSafeAddress: safeAddress
      })

      this.#safeSdk = await Safe.create({ ethAdapter: this.#ethAdapter, safeAddress })
    } catch {
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig
      }

      this.#safeSdk = await Safe.create({ ethAdapter: this.#ethAdapter, predictedSafe })
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
    options: MetaTransactionOptions
  ): Promise<string> {
    if (!this.#relayPack || !this.#safeSdk || !this.#safeProxyFactoryContract) {
      throw new Error('SDK not initialized')
    }

    const safeAddress = await this.#safeSdk.getAddress()

    const standardizedSafeTx = await this.#relayPack.createRelayedTransaction({
      safe: this.#safeSdk,
      transactions,
      options
    })

    const safeSingletonContract = await getSafeContract({
      ethAdapter: this.#ethAdapter,
      safeVersion
    })

    const signedSafeTx = await this.#safeSdk.signTransaction(standardizedSafeTx)

    const transactionData = safeSingletonContract.encode('execTransaction', [
      signedSafeTx.data.to,
      signedSafeTx.data.value,
      signedSafeTx.data.data,
      signedSafeTx.data.operation,
      signedSafeTx.data.safeTxGas,
      signedSafeTx.data.baseGas,
      signedSafeTx.data.gasPrice,
      signedSafeTx.data.gasToken,
      signedSafeTx.data.refundReceiver,
      signedSafeTx.encodedSignatures()
    ])

    let relayTransactionTarget = ''
    let encodedTransaction = ''
    const isSafeDeployed = await this.#safeSdk.isSafeDeployed()
    if (isSafeDeployed) {
      relayTransactionTarget = safeAddress
      encodedTransaction = transactionData
    } else {
      const multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
        ethAdapter: this.#ethAdapter,
        safeVersion
      })
      relayTransactionTarget = multiSendCallOnlyContract.getAddress()
      const safeSingletonContract = await getSafeContract({
        ethAdapter: this.#ethAdapter,
        safeVersion
      })

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig: {
          owners: [await this.getSignerAddress()],
          threshold: 1
        },
        safeDeploymentConfig: {
          saltNonce: PREDETERMINED_SALT_NONCE
        }
      }

      const initializer = await encodeSetupCallData({
        ethAdapter: this.#ethAdapter,
        safeContract: safeSingletonContract,
        safeAccountConfig: predictedSafe.safeAccountConfig
      })

      const safeDeploymentTransaction: MetaTransactionData = {
        to: this.#safeProxyFactoryContract.getAddress(),
        value: '0',
        data: encodeCreateProxyWithNonce(
          this.#safeProxyFactoryContract,
          safeSingletonContract.getAddress(),
          initializer
        ),
        operation: OperationType.Call
      }
      const safeTransaction: MetaTransactionData = {
        to: safeAddress,
        value: '0',
        data: transactionData,
        operation: OperationType.Call
      }

      const multiSendData = encodeMultiSendData([safeDeploymentTransaction, safeTransaction])
      encodedTransaction = multiSendCallOnlyContract.encode('multiSend', [multiSendData])
    }

    const chainId = await this.#ethAdapter.getChainId()
    const relayTransaction: RelayTransaction = {
      target: relayTransactionTarget,
      encodedTransaction: encodedTransaction,
      chainId,
      options
    }
    const response = await this.#relayPack.relayTransaction(relayTransaction)
    return response.taskId
  }
}

export default AccountAbstraction
