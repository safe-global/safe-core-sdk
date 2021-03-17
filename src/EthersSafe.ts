import { BigNumber, Wallet } from 'ethers'
import { GnosisSafe } from '../typechain'
import SafeAbi from './abis/SafeAbiV1-2-0.json'
import Safe from './Safe'
import { areAddressesEqual } from './utils'
import { EthSignSignature, SafeSignature } from './utils/signatures'
import { SafeTransaction } from './utils/transactions'

class EthersSafe implements Safe {
  #contract: GnosisSafe
  #ethers: any
  #signer: Wallet

  constructor(ethers: any, signer: Wallet, safeAddress: string) {
    this.#ethers = ethers
    this.#signer = signer
    this.#contract = new ethers.Contract(safeAddress, SafeAbi, signer)
  }

  address(): string {
    return this.#contract.address
  }

  async getOwners(): Promise<string[]> {
    return this.#contract.getOwners()
  }

  async getThreshold(): Promise<BigNumber> {
    return this.#contract.getThreshold()
  }

  async signMessage(hash: string): Promise<SafeSignature> {
    const address = await this.#signer.address
    const messageArray = this.#ethers.utils.arrayify(hash)
    const signature = await this.#signer.signMessage(messageArray)
    return new EthSignSignature(address, signature)
  }

  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    const safeTransactionData = safeTransaction.data
    const txHash = await this.#contract.getTransactionHash(
      safeTransactionData.to,
      safeTransactionData.value,
      safeTransactionData.data,
      safeTransactionData.operation,
      safeTransactionData.safeTxGas,
      safeTransactionData.baseGas,
      safeTransactionData.gasPrice,
      safeTransactionData.gasToken,
      safeTransactionData.refundReceiver,
      safeTransactionData.nonce
    )
    return txHash
  }

  async confirmTransaction(safeTransaction: SafeTransaction): Promise<void> {
    const owners = await this.getOwners()
    if (!owners.find((owner: string) => areAddressesEqual(owner, this.#signer.address))) {
      throw new Error('Transactions can only be confirmed by Safe owners')
    }
    const txHash = await this.getTransactionHash(safeTransaction)
    const signature = await this.signMessage(txHash)
    safeTransaction.signatures.set(signature.signer, signature)
  }

  async encodeTransaction(transaction: SafeTransaction): Promise<string> {
    const encodedTx = await this.#contract.interface.encodeFunctionData('execTransaction', [
      transaction.data.to,
      transaction.data.value,
      transaction.data.data,
      transaction.data.operation,
      transaction.data.safeTxGas,
      transaction.data.baseGas,
      transaction.data.gasPrice,
      transaction.data.gasToken,
      transaction.data.refundReceiver,
      transaction.encodedSignatures()
    ])
    return encodedTx
  }

  async executeTransaction(transaction: SafeTransaction, options?: any): Promise<any> {
    const threshold = await this.getThreshold()
    if (threshold.gt(transaction.signatures.size)) {
      const signaturesMissing = threshold.sub(transaction.signatures.size).toNumber()
      throw new Error(
        `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${
          signaturesMissing > 1 ? 's' : ''
        } missing`
      )
    }
    const txResponse = await this.#contract.execTransaction(
      transaction.data.to,
      transaction.data.value,
      transaction.data.data,
      transaction.data.operation,
      transaction.data.safeTxGas,
      transaction.data.baseGas,
      transaction.data.gasPrice,
      transaction.data.gasToken,
      transaction.data.refundReceiver,
      transaction.encodedSignatures(),
      { ...options }
    )
    return txResponse
  }
}

export default EthersSafe
