import SafeAbi from './abis/SafeAbiV1-1-1.json'
import EthersSafeSigner from './EthersSafeSigner'
import Safe from './Safe'
import { SafeTransaction, SafeTransactionData } from './utils/transactions'

class EthersSafe implements Safe {
  contract: any
  signer?: EthersSafeSigner

  constructor(ethers: any, provider: any, address: string, signer?: EthersSafeSigner) {
    this.contract = new ethers.Contract(address, SafeAbi, provider)
    this.signer = signer
  }

  address(): string {
    return this.contract.address
  }

  async getTransactionHash(safeTransaction: SafeTransaction): Promise<string> {
    const safeTransactionData = safeTransaction.data
    const txHash = await this.contract.getTransactionHash(
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

  async confirmTransaction(safeTransaction: SafeTransaction) {
    // TODO: check owners
    if (!this.signer) {
      throw new Error('Signer not initialized')
    }
    const txHash = await this.getTransactionHash(safeTransaction)
    const signature = await this.signer.sign(txHash)
    safeTransaction.signatures.set(signature.signer, signature)
    return safeTransaction
  }

  async encodeTransaction(transaction: SafeTransactionData, signatures: string): Promise<string> {
    const encodedTx = await this.contract.interface.functions.execTransaction.encode([
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      signatures
    ])
    return encodedTx
  }

  async executeTransaction(transaction: SafeTransactionData, signatures: string): Promise<string> {
    // TODO check nonce
    const txHash = await this.contract.execTransaction(
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      signatures
    )
    return txHash
  }
}

export default EthersSafe
