import {
  AccountAbstractionConfig,
  OperationType
} from '@safe-global/account-abstraction-kit-poc/types'
import Safe, {
  predictSafeAddress,
  encodeMultiSendData,
  EthersAdapter,
  getMultiSendCallOnlyContract,
  getProxyFactoryContract,
  getSafeContract,
  PredictedSafeProps,
  PREDETERMINED_SALT_NONCE,
  SafeDeploymentConfig,
  encodeCreateProxyWithNonce,
  SafeAccountConfig,
  encodeSetupCallData
} from '@safe-global/protocol-kit'
import { RelayPack } from '@safe-global/relay-kit'
import {
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

const safeVersion: SafeVersion = '1.3.0'

class AccountAbstraction {
  #ethAdapter: EthersAdapter
  #signer: ethers.Signer
  #safeContract?: GnosisSafeContract
  #safeProxyFactoryContract?: GnosisSafeProxyFactoryContract
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

    this.#safeContract = await getSafeContract({
      ethAdapter: this.#ethAdapter,
      safeVersion,
      customSafeAddress: safeAddress
    })
  }

  setRelayPack(relayPack: RelayPack) {
    this.#relayPack = relayPack
  }

  async getSignerAddress(): Promise<string> {
    const signerAddress = await this.#signer.getAddress()
    return signerAddress
  }

  async getNonce(): Promise<number> {
    if (!this.#safeContract) {
      throw new Error('SDK not initialized')
    }
    return (await this.isSafeDeployed()) ? await this.#safeContract.getNonce() : 0
  }

  getSafeAddress(): string {
    if (!this.#safeContract) {
      throw new Error('SDK not initialized')
    }
    return this.#safeContract.getAddress()
  }

  async isSafeDeployed(): Promise<boolean> {
    if (!this.#signer.provider) {
      throw new Error('SDK not initialized')
    }
    const address = this.getSafeAddress()
    const codeAtAddress = await this.#signer.provider.getCode(address)
    const isDeployed = codeAtAddress !== '0x'
    return isDeployed
  }

  async relayTransaction(
    transactions: MetaTransactionData[],
    options: MetaTransactionOptions
  ): Promise<string> {
    if (!this.#relayPack || !this.#safeContract || !this.#safeProxyFactoryContract) {
      throw new Error('SDK not initialized')
    }

    const safeAddress = this.getSafeAddress()
    const safe = await Safe.create({
      ethAdapter: this.#ethAdapter,
      safeAddress
    })

    const standardizedSafeTx = await this.#relayPack.createRelayedTransaction(
      safe,
      transactions,
      options
    )

    const signedSafeTx = await safe.signTransaction(standardizedSafeTx)

    const transactionData = this.#safeContract.encode('execTransaction', [
      signedSafeTx.data,
      signedSafeTx.encodedSignatures()
    ])

    let relayTransactionTarget = ''
    let encodedTransaction = ''
    const isSafeDeployed = await this.isSafeDeployed()
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
        safeContract: this.#safeContract,
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
