import {
  CompatibilityFallbackHandlerContract,
  EthAdapter,
  SafeContract,
  SafeSignature,
  SafeEIP712Args
} from '@safe-global/safe-core-sdk-types'
import { getCompatibilityFallbackHandlerContract } from '../contracts/safeDeploymentContracts'
import { ContractNetworksConfig } from '../types'
import { generateSignature, generateEIP712Signature, EthSafeSignature } from '../utils'
import { DEFAULT_SAFE_VERSION } from '../contracts/config'
import { ethers } from 'ethers'

/**
 * @class SignatureManager
 * The SignatureManager class is responsible to provide the tools to generate and validate signatures
 * It can be accessed through the Safe instance `safeSdk.signature`
 */
class SignatureManager {
  #ethAdapter: EthAdapter
  #safeContract?: SafeContract
  #contractNetworks?: ContractNetworksConfig
  #fallbackHandler?: CompatibilityFallbackHandlerContract

  #MAGIC_VALUE = '0x1626ba7e'

  constructor(
    ethAdapter: EthAdapter,
    safeContract?: SafeContract,
    contractNetworks?: ContractNetworksConfig
  ) {
    this.#ethAdapter = ethAdapter
    this.#safeContract = safeContract
    this.#contractNetworks = contractNetworks
  }

  /**
   * Initialize the SignatureManager
   * This method should be called before using any of the SignatureManager methods. It will fetch the Safe CompatibilityFallbackHandler contract
   */
  async init() {
    const safeVersion = (await this.#safeContract?.getVersion()) ?? DEFAULT_SAFE_VERSION
    const chainId = await this.#ethAdapter.getChainId()

    const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
      ethAdapter: this.#ethAdapter,
      safeVersion,
      customContracts: this.#contractNetworks?.[chainId]
    })

    this.#fallbackHandler = compatibilityFallbackHandlerContract
  }

  /**
   * Call the isValidSignature method of the Safe CompatibilityFallbackHandler contract
   * @param messageHash The hash of the message to be signed
   * @param signature The signature to be validated or '0x'. You can pass
   *  1) An array of SafeSignature. In this case the signatures will be concatenated for validation
   *  2) The concatenated signatures
   *  3) '0x' if you want to validate an onchain message (Initialized by default)
   * @returns A boolean indicating if the signature is valid
   * @link https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol
   */
  isValidSignature = async (
    messageHash: string,
    signature: SafeSignature[] | string = '0x'
  ): Promise<boolean> => {
    const safeAddress = this.#safeContract?.getAddress() || ''

    const data = this.#fallbackHandler?.encode('isValidSignature(bytes32,bytes)', [
      messageHash,
      signature && Array.isArray(signature) ? this.buildSignature(signature) : signature
    ])

    try {
      const isValidSignatureResponse = await this.#ethAdapter.call({
        from: safeAddress,
        to: safeAddress,
        data: data || '0x'
      })

      return isValidSignatureResponse.slice(0, 10).toLowerCase() === this.#MAGIC_VALUE
    } catch (error) {
      console.error(error)
      return false
    }
  }

  /**
   * Call the getMessageHash method of the Safe CompatibilityFallbackHandler contract
   * @param messageHash The hash of the message to be signed
   * @returns Returns the hash of a message to be signed by owners
   * @link https://github.com/safe-global/safe-contracts/blob/8ffae95faa815acf86ec8b50021ebe9f96abde10/contracts/handler/CompatibilityFallbackHandler.sol#L26-L28
   */
  getMessageHash = async (messageHash: string): Promise<string> => {
    const safeAddress = this.#safeContract?.getAddress() || ''

    const data = this.#fallbackHandler?.encode('getMessageHash', [messageHash])

    const safeMessageHash = await this.#ethAdapter.call({
      from: safeAddress,
      to: safeAddress,
      data: data || '0x'
    })

    return safeMessageHash
  }

  /**
   * Helper to concatenate signatures in order to validate them
   * @param signatures An array of SafeSignature
   * @returns The concatenated signatures
   */
  buildSignature(signatures: SafeSignature[]): string {
    const SIGNATURE_LENGTH_BYTES = 65

    signatures.sort((left, right) =>
      left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
    )

    let signatureBytes = '0x'
    let dynamicBytes = ''

    for (const sig of signatures) {
      if (sig.isSmartContractSignature) {
        /* 
          A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended 
          at the end of signature bytes.
          The signature format is
          Signature type == 0
          Constant part: 65 bytes
          {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
          Dynamic part (solidity bytes): 32 bytes + signature data length
          {32-bytes signature length}{bytes signature data}
        */
        const dynamicPartPosition = (
          signatures.length * SIGNATURE_LENGTH_BYTES +
          dynamicBytes.length / 2
        )
          .toString(16)
          .padStart(64, '0')

        signatureBytes += sig.staticPart(dynamicPartPosition)
        dynamicBytes += sig.dynamicPart()
      } else {
        signatureBytes += sig.data.slice(2)
      }
    }

    return signatureBytes + dynamicBytes
  }

  /**
   * Helper function to generate a signature for a message using the EIP191 standard
   * @param messageHash The hash of the message to be signed
   * @returns The signature of the message
   */
  async signEIP191Message(messageHash: string): Promise<SafeSignature> {
    const signature = await generateSignature(this.#ethAdapter, messageHash)

    return signature
  }

  /**
   * Helper function to generate a Smart contract signature for a message
   * @param messageHash This is the Safe message hash
   * @returns A signature of the message (Smart contract signature)
   */
  async signSafeMessageHash(messageHash: string): Promise<SafeSignature> {
    const signature = await generateSignature(this.#ethAdapter, messageHash)
    const safeAddress = this.#safeContract?.getAddress() || ''

    return new EthSafeSignature(safeAddress, signature.data, true)
  }

  /**
   * Helper function to generate a signature for a message using the EIP712 standard
   * @param safeEIP712Args The arguments to generate the EIP712 signature
   * @param methodVersion The version of the EIP712 signature
   * @returns The signature of the message
   */
  async signEIP712Message(
    safeEIP712Args: SafeEIP712Args,
    methodVersion?: 'v3' | 'v4'
  ): Promise<SafeSignature> {
    const signature = await generateEIP712Signature(this.#ethAdapter, safeEIP712Args, methodVersion)

    return signature
  }

  parseSignature(signatures: any, safeTxHash: string, ignoreTrailing = true): string[] {
    if (!signatures) {
      return []
    }

    // Convert signatures to buffer if it is a string
    if (typeof signatures === 'string') {
      signatures = ethers.utils.arrayify(signatures)
    }

    const signatureSize = 65
    const dataPosition = signatures.length

    const safeSignatures = []

    for (let i = 0; i < signatures.length; i += signatureSize) {
      if (i >= dataPosition) {
        break
      }

      const signature = signatures.slice(i, i + signatureSize)

      if (ignoreTrailing && signature.length < 65) {
        break
      }

      const v = signature[64]
      const r = '0x' + ethers.utils.hexlify(signature.slice(0, 32))
      const s = '0x' + ethers.utils.hexlify(signature.slice(32, 64))

      let safeSignature

      // Your existing logic for creating signature objects would go here
      if (v === 0) {
        // Contract signature
        // Convert to BigInt manually
        const contractSignatureLength = BigInt(
          '0x' + ethers.utils.hexlify(signatures.slice(s, s + 8))
        )
        const contractSignature = ethers.utils
          .hexlify(signatures.slice(s + 32, s + 32 + Number(contractSignatureLength)))
          .substring(2)
        safeSignature = 'Contract Signature'
      } else if (v === 1) {
        // Approved hash
        safeSignature = 'Approved Hash'
      } else if (v > 30) {
        // ETH_SIGN
        safeSignature = 'ETH_SIGN'
      } else {
        // EOA
        safeSignature = 'EOA'
      }

      safeSignatures.push(safeSignature)
    }

    return safeSignatures
  }
}

export default SignatureManager
