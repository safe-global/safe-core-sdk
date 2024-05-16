import Safe, { SigningMethod, buildContractSignature } from '@safe-global/protocol-kit'
import { hashSafeMessage } from '@safe-global/protocol-kit'

// This file can be used to play around with the Safe Core SDK

interface Config {
  RPC_URL: string
  OWNER1_PRIVATE_KEY: string
  OWNER2_PRIVATE_KEY: string
  SAFE_3_3_ADDRESS: string
  SIGNER_SAFE_ADDRESS: string
}

// To run this script, you need a Safe with the following configuration
// - 3/3 Safe with 3 owners and threshold 3
//   - Owner 1: public address from OWNER1_PRIVATE_KEY
//   - Owner 2: public address from OWNER2_PRIVATE_KEY
//   - Owner 3: SIGNER_SAFE_ADDRESS (1/1 with OWNER1_PRIVATE_KEY public address as owner)
const config: Config = {
  RPC_URL: 'https://sepolia.gateway.tenderly.co',
  OWNER1_PRIVATE_KEY: '<OWNER1_PRIVATE_KEY>',
  OWNER2_PRIVATE_KEY: '<OWNER2_PRIVATE_KEY>',
  SIGNER_SAFE_ADDRESS: '<SIGNER_SAFE_ADDRESS>',
  SAFE_3_3_ADDRESS: '<SAFE_3_3_ADDRESS>'
}

async function main() {
  // Create safeSdk instances
  let protocolKit = await Safe.init({
    provider: config.RPC_URL,
    signer: config.OWNER1_PRIVATE_KEY,
    safeAddress: config.SAFE_3_3_ADDRESS
  })

  const MESSAGE = 'I am the owner of this Safe account'

  let message = protocolKit.createMessage(MESSAGE)

  message = await protocolKit.signMessage(message) // Owner 1 signature

  protocolKit = await protocolKit.connect({
    signer: config.OWNER2_PRIVATE_KEY,
    safeAddress: config.SAFE_3_3_ADDRESS
  }) // Connect another owner

  message = await protocolKit.signMessage(message, SigningMethod.ETH_SIGN_TYPED_DATA_V4) // Owner 2 signature

  protocolKit = await protocolKit.connect({
    signer: config.OWNER1_PRIVATE_KEY,
    safeAddress: config.SIGNER_SAFE_ADDRESS
  })

  let signerSafeMessage = protocolKit.createMessage(MESSAGE)
  signerSafeMessage = await protocolKit.signMessage(
    signerSafeMessage,
    SigningMethod.SAFE_SIGNATURE,
    config.SAFE_3_3_ADDRESS
  )

  message.addSignature(
    await buildContractSignature(
      Array.from(signerSafeMessage.signatures.values()),
      config.SIGNER_SAFE_ADDRESS
    )
  )

  protocolKit = await protocolKit.connect({
    signer: config.OWNER1_PRIVATE_KEY,
    safeAddress: config.SAFE_3_3_ADDRESS
  })

  // Validate the signature sending the Safe message hash and the concatenated signatures
  const messageHash = hashSafeMessage(MESSAGE)
  const safeMessageHash = await protocolKit.getSafeMessageHash(messageHash)

  const isValid = await protocolKit.isValidSignature(messageHash, message.encodedSignatures())

  console.log('Message: ', MESSAGE)
  console.log('Message Hash: ', messageHash)
  console.log('Safe Message Hash: ', safeMessageHash)
  console.log('Signatures: ', message.signatures.values())

  console.log(`The signature is ${isValid ? 'valid' : 'invalid'}`)
}

main()
