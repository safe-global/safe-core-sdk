import {
  CompatibilityFallbackHandlerContract,
  EthAdapter,
  SafeContract,
  SafeSignature,
  SafeTransactionEIP712Args
} from '@safe-global/safe-core-sdk-types'
import { getCompatibilityFallbackHandlerContract } from '../contracts/safeDeploymentContracts'
import { ContractNetworksConfig } from '../types'
import { generateSignature, generateEIP712Signature } from '../utils'

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

  async init() {
    const safeVersion = (await this.#safeContract?.getVersion()) ?? '1.3.0'
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
   * @param signature The signature to be validated or '0x'
   * @param safeSdk An instance of Safe
   * @returns A boolean indicating if the signature is valid
   * @link https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol
   */
  isValidSignature = async (messageHash: string, signature: string): Promise<boolean> => {
    const safeAddress = this.#safeContract?.getAddress() || ''

    const eip1271data =
      this.#fallbackHandler?.encode('isValidSignature(bytes32,bytes)', [messageHash, signature]) ||
      '0x'

    try {
      const isValidSignatureResponse = await this.#ethAdapter.call({
        from: safeAddress,
        to: safeAddress,
        data: eip1271data
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
   * @param safeSdk An instance of Safe
   * @returns Returns the hash of a message to be signed by owners
   * @link https://github.com/safe-global/safe-contracts/blob/8ffae95faa815acf86ec8b50021ebe9f96abde10/contracts/handler/CompatibilityFallbackHandler.sol#L26-L28
   */
  getMessageHash = async (messageHash: string): Promise<string> => {
    const safeAddress = this.#safeContract?.getAddress() || ''

    const data = this.#fallbackHandler?.encode('getMessageHash', [messageHash]) || '0x'

    const safeMessageHash = await this.#ethAdapter.call({
      from: safeAddress,
      to: safeAddress,
      data
    })

    return safeMessageHash
  }

  buildSignature(signatures: SafeSignature[]): string {
    signatures.sort((left, right) =>
      left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
    )

    let signatureBytes = '0x'

    for (const sig of signatures) {
      signatureBytes += sig.data.slice(2)
    }

    return signatureBytes
  }

  async signEIP191Message(hash: string): Promise<SafeSignature> {
    const signature = await generateSignature(this.#ethAdapter, hash)

    return signature
  }

  async signEIP712Message(
    safeTransactionEIP712Args: SafeTransactionEIP712Args,
    methodVersion?: 'v3' | 'v4'
  ): Promise<SafeSignature> {
    const signature = await generateEIP712Signature(
      this.#ethAdapter,
      safeTransactionEIP712Args,
      methodVersion
    )

    return signature
  }
}

export default SignatureManager
