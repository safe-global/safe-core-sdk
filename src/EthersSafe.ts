import { BigNumber, Wallet } from 'ethers'
import { GnosisSafe } from '../typechain'
import SafeAbi from './abis/SafeAbiV1-2-0.json'
import Safe from './Safe'
import { EthSignSignature, SafeSignature } from './utils/signatures'
import { SafeTransaction } from './utils/transactions'

class EthersSafe implements Safe {
  #contract: GnosisSafe
  #ethers: any
  #signer: Wallet

  /**
   * Creates an instance of the Safe Core SDK.
   *
   * @param ethers - Ethers v5 library
   * @param signer - Ethers signer
   * @param safeAddress - The address of the Safe account to use
   * @returns The Safe Core SDK instance
   */
  constructor(ethers: any, signer: Wallet, safeAddress: string) {
    this.#ethers = ethers
    this.#signer = signer
    this.#contract = new ethers.Contract(safeAddress, SafeAbi, signer)
  }

  /**
   * Returns the address of the current Safe Proxy contract.
   *
   * @returns The address of the Safe Proxy contract
   */
  getAddress(): string {
    return this.#contract.address
  }

  /**
   * Returns the Safe Master Copy contract version.
   *
   * @returns The Safe Master Copy contract version
   */
  async getContractVersion(): Promise<string> {
    return this.#contract.VERSION()
  }

  /**
   * Returns the list of Safe owner accounts.
   *
   * @returns The list of owners
   */
  async getOwners(): Promise<string[]> {
    return this.#contract.getOwners()
  }

  /**
   * Returns the Safe threshold.
   *
   * @returns The Safe threshold
   */
  async getThreshold(): Promise<BigNumber> {
    return this.#contract.getThreshold()
  }

  /**
   * Returns the chainId of the connected network.
   *
   * @returns The chainId of the connected network
   */
  async getNetworkId(): Promise<number> {
    return (await this.#signer.provider.getNetwork()).chainId
  }

  /**
   * Returns the ETH balance of the Safe.
   *
   * @returns The ETH balance of the Safe
   */
  async getBalance(): Promise<BigNumber> {
    return BigNumber.from(await this.#signer.provider.getBalance(this.getAddress()))
  }

  /**
   * Returns the list of addresses of all the enabled Safe modules.
   *
   * @returns The list of addresses of all the enabled Safe modules
   */
  async getModules(): Promise<string[]> {
    return this.#contract.getModules()
  }

  /**
   * Returns the transaction hash to be signed by the owners.
   *
   * @param safeTransaction - The Safe transaction
   * @returns The transaction hash of the Safe transaction
   */
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

  /**
   * Signs data using the current owner account.
   *
   * @param hash - The data to sign
   * @returns The Safe signature
   */
  async signMessage(hash: string): Promise<SafeSignature> {
    const address = await this.#signer.address
    const messageArray = this.#ethers.utils.arrayify(hash)
    const signature = await this.#signer.signMessage(messageArray)
    return new EthSignSignature(address, signature)
  }

  /**
   * Adds the signature of the current owner to the Safe transaction object.
   *
   * @param safeTransaction - The Safe transaction to be signed
   */
  async confirmTransaction(safeTransaction: SafeTransaction): Promise<void> {
    const owners = await this.getOwners()
    if (
      owners.filter((owner: string) => owner.toLowerCase() === this.#signer.address.toLowerCase())
        .length === 0
    ) {
      throw new Error('Transactions can only be confirmed by Safe owners')
    }
    const txHash = await this.getTransactionHash(safeTransaction)
    const signature = await this.signMessage(txHash)
    safeTransaction.signatures.set(signature.signer, signature)
  }

  /**
   * Returns the encoding of a Safe transaction.
   *
   * @param transaction - The Safe transaction
   * @returns The encoding of the Safe transaction
   */
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

  /**
   * Executes a Safe transaction.
   *
   * @param transaction - The Safe transaction to execute
   * @param options - Execution configuration options
   * @returns The Safe transaction response
   */
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

  /**
   * Checks if a specific Safe module is enabled for the current Safe.
   *
   * @param moduleAddress - The desired module address
   * @returns TRUE if the module is enabled
   */
  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.#contract.isModuleEnabled(moduleAddress)
  }
}

export default EthersSafe
