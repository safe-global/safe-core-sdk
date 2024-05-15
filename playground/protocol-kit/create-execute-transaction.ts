import * as dotenv from 'dotenv'
import Safe, { SigningMethod } from '@safe-global/protocol-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'

dotenv.config()

const { SIGNER_ADDRESS_PRIVATE_KEY } = process.env

// This file can be used to play around with the Safe Core SDK
// The script creates, signs and executes a transaction for an existing 1/1 Safe

interface Config {
  RPC_URL: string
  /** Private key of a signer owning the Safe */
  SIGNER_ADDRESS_PRIVATE_KEY: string
  /** Address of a 1/1 Safe */
  SAFE_ADDRESS: string
}

const config: Config = {
  RPC_URL: 'https://sepolia.gateway.tenderly.co',
  SIGNER_ADDRESS_PRIVATE_KEY: SIGNER_ADDRESS_PRIVATE_KEY!,
  SAFE_ADDRESS: '<SAFE_ADDRESS>'
}

async function main() {
  // Create Safe instance
  const safe = await Safe.init({
    provider: config.RPC_URL,
    signer: config.SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: config.SAFE_ADDRESS
  })

  console.log('Creating transaction with Safe:')
  console.log(' - Address: ', await safe.getAddress())
  console.log(' - ChainID: ', await safe.getChainId())
  console.log(' - Version: ', await safe.getContractVersion())
  console.log(' - Threshold: ', await safe.getThreshold(), '\n')

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    to: config.SAFE_ADDRESS,
    value: '1000000000000000', // 0.001 ether
    data: '0x',
    operation: OperationType.Call
  }

  let safeTransaction
  try {
    safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] })
  } catch (err) {
    console.log('`createTransaction` failed:')
    console.log(err)
    return
  }

  console.log('Created the Safe transaction.')

  let signedSafeTransaction
  try {
    // Sign the safeTransaction
    signedSafeTransaction = await safe.signTransaction(safeTransaction, SigningMethod.ETH_SIGN)
  } catch (err) {
    console.log('`signTransaction` failed:')
    console.log(err)
    return
  }

  console.log('Signed the transaction.')

  let result
  try {
    // Execute the signed transaction
    result = await safe.executeTransaction(signedSafeTransaction)
  } catch (err) {
    console.log('`executeTransaction` failed:')
    console.log(err)
    return
  }

  console.log('Succesfully executed the transaction:')
  console.log(' - Tx hash: ', result.hash)
}

main()
