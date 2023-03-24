import { RelayAdapter } from '@safe-global/relay-kit'
import Safe from '@safe-global/safe-core-sdk'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { ethers } from 'ethers'
import { GnosisSafe__factory } from '../typechain/factories'
import { GnosisSafe } from '../typechain/GnosisSafe'
import { MultiSendCallOnly } from '../typechain/libraries'
import { GnosisSafeProxyFactory } from '../typechain/proxies'
import {
  AccountAbstractionConfig,
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  RelayTransaction
} from './types'
import { getMultiSendCallOnlyContract, getSafeContract, getSafeProxyFactoryContract } from './utils'
import {
  calculateChainSpecificProxyAddress,
  encodeCreateProxyWithNonce,
  encodeExecTransaction,
  encodeMultiSendData,
  getSafeInitializer
} from './utils/contracts'

class AccountAbstraction {
  #signer: ethers.Signer
  #chainId?: number
  #safeContract?: GnosisSafe
  #safeProxyFactoryContract?: GnosisSafeProxyFactory
  #multiSendCallOnlyContract?: MultiSendCallOnly
  #relayAdapter?: RelayAdapter

  constructor(signer: ethers.Signer) {
    this.#signer = signer
  }

  async init(options: AccountAbstractionConfig) {
    if (!this.#signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    const { relayAdapter } = options
    this.setRelayAdapter(relayAdapter)

    this.#chainId = (await this.#signer.provider.getNetwork()).chainId
    this.#safeProxyFactoryContract = getSafeProxyFactoryContract(this.#chainId, this.#signer)
    this.#multiSendCallOnlyContract = getMultiSendCallOnlyContract(this.#chainId, this.#signer)
    const safeAddress = await calculateChainSpecificProxyAddress(
      this.#safeProxyFactoryContract,
      this.#signer,
      this.#chainId
    )
    this.#safeContract = GnosisSafe__factory.connect(safeAddress, this.#signer)
  }

  setRelayAdapter(relayAdapter: RelayAdapter) {
    this.#relayAdapter = relayAdapter
  }

  async getSignerAddress(): Promise<string> {
    const signerAddress = await this.#signer.getAddress()
    return signerAddress
  }

  async getNonce(): Promise<number> {
    if (!this.#safeContract) {
      throw new Error('SDK not initialized')
    }
    return (await this.isSafeDeployed()) ? (await this.#safeContract.nonce()).toNumber() : 0
  }

  getSafeAddress(): string {
    if (!this.#safeContract) {
      throw new Error('SDK not initialized')
    }
    return this.#safeContract.address
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
    if (
      !this.#relayAdapter ||
      !this.#chainId ||
      !this.#safeContract ||
      !this.#multiSendCallOnlyContract ||
      !this.#safeProxyFactoryContract
    ) {
      throw new Error('SDK not initialized')
    }

    const safeAddress = this.getSafeAddress()

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: this.#signer
    })
    const safe = await Safe.create({
      ethAdapter,
      safeAddress
    })

    const standardizedSafeTx = await this.#relayAdapter.createRelayedTransaction(
      safe,
      transactions,
      options
    )

    const signedSafeTx = await safe.signTransaction(standardizedSafeTx)

    const transactionData = encodeExecTransaction(
      this.#safeContract,
      signedSafeTx.data,
      signedSafeTx.encodedSignatures()
    )

    let relayTransactionTarget = ''
    let encodedTransaction = ''
    const isSafeDeployed = await this.isSafeDeployed()
    if (isSafeDeployed) {
      relayTransactionTarget = this.#safeContract.address
      encodedTransaction = transactionData
    } else {
      relayTransactionTarget = this.#multiSendCallOnlyContract.address
      const safeSingletonContract = getSafeContract(this.#chainId, this.#signer)
      const initializer = await getSafeInitializer(
        this.#safeContract,
        await this.getSignerAddress(),
        this.#chainId
      )

      const safeDeploymentTransaction: MetaTransactionData = {
        to: this.#safeProxyFactoryContract.address,
        value: '0',
        data: encodeCreateProxyWithNonce(
          this.#safeProxyFactoryContract,
          safeSingletonContract.address,
          initializer
        ),
        operation: OperationType.Call
      }
      const safeTransaction: MetaTransactionData = {
        to: this.#safeContract.address,
        value: '0',
        data: transactionData,
        operation: OperationType.Call
      }

      const multiSendData = encodeMultiSendData([safeDeploymentTransaction, safeTransaction])
      encodedTransaction = this.#multiSendCallOnlyContract.interface.encodeFunctionData(
        'multiSend',
        [multiSendData]
      )
    }

    const relayTransaction: RelayTransaction = {
      target: relayTransactionTarget,
      encodedTransaction: encodedTransaction,
      chainId: this.#chainId,
      options
    }
    const response = await this.#relayAdapter.relayTransaction(relayTransaction)
    return response.taskId
  }
}

export default AccountAbstraction
