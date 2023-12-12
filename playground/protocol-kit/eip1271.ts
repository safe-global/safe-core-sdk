import Safe from '@safe-global/protocol-kit'
import { EthersAdapter, hashSafeMessage } from '@safe-global/protocol-kit'
import { ethers, JsonRpcProvider } from 'ethers'

// This file can be used to play around with the Safe Core SDK

interface Config {
  RPC_URL: string
  OWNER1_PRIVATE_KEY: string
  OWNER2_PRIVATE_KEY: string
  OWNER3_PRIVATE_KEY: string
  SAFE_2_3_ADDRESS: string
}

const config: Config = {
  RPC_URL: '<RPC_URL>',
  // Create a Safe 2/3 with 3 owners and fill this info
  OWNER1_PRIVATE_KEY: '<OWNER1_PRIVATE_KEY>',
  OWNER2_PRIVATE_KEY: '<OWNER2_PRIVATE_KEY>',
  OWNER3_PRIVATE_KEY: '<OWNER3_PRIVATE_KEY>',
  SAFE_2_3_ADDRESS: '<SAFE_2_3_ADDRESS>'
}

async function main() {
  const provider = new JsonRpcProvider(config.RPC_URL)
  const signer1 = new ethers.Wallet(config.OWNER1_PRIVATE_KEY, provider)
  const signer2 = new ethers.Wallet(config.OWNER2_PRIVATE_KEY, provider)

  // Create safeSdk instances
  const safeSdk1 = await Safe.create({
    ethAdapter: new EthersAdapter({
      ethers,
      signerOrProvider: signer1
    }),
    safeAddress: config.SAFE_2_3_ADDRESS
  })

  const safeSdk2 = await Safe.create({
    ethAdapter: new EthersAdapter({
      ethers,
      signerOrProvider: signer2
    }),
    safeAddress: config.SAFE_2_3_ADDRESS
  })

  const MESSAGE_TO_SIGN = 'I am the owner of this Safe account'

  const messageHash = hashSafeMessage(MESSAGE_TO_SIGN)
  const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

  const ethSignSig = await safeSdk1.signHash(safeMessageHash)
  const typedDataSig = await safeSdk2.signTypedData(safeSdk2.createMessage(MESSAGE_TO_SIGN), 'v4')

  // Validate the signature sending the Safe message hash and the concatenated signatures
  const isValid = await safeSdk1.isValidSignature(messageHash, [typedDataSig, ethSignSig])

  console.log('Message: ', MESSAGE_TO_SIGN)
  console.log('Message Hash: ', messageHash)
  console.log('Safe Message Hash: ', safeMessageHash)
  console.log('Signatures: ', ethSignSig, typedDataSig)

  console.log(`The signature is ${isValid ? 'valid' : 'invalid'}`)
}

main()
