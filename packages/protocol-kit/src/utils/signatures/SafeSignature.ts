import { SafeSignature } from '@safe-global/types-kit'

export class EthSafeSignature implements SafeSignature {
  signer: string
  data: string
  isContractSignature: boolean

  /**
   * Creates an instance of a Safe signature.
   *
   * @param signer - Ethers signer
   * @param signature - The Safe signature
   * @returns The Safe signature instance
   */
  constructor(signer: string, signature: string, isContractSignature = false) {
    this.signer = signer
    this.data = signature
    this.isContractSignature = isContractSignature
  }

  /**
   * Returns the static part of the Safe signature.
   *
   * @returns The static part of the Safe signature
   */
  staticPart(dynamicOffset?: string) {
    if (this.isContractSignature) {
      return `${this.signer.slice(2).padStart(64, '0')}${dynamicOffset || ''}00`
    }

    return this.data
  }

  /**
   * Returns the dynamic part of the Safe signature.
   *
   * @returns The dynamic part of the Safe signature
   */
  dynamicPart() {
    if (this.isContractSignature) {
      // NOTE: Assuming single EIP-191 signaures from constructor
      return `${this.data.slice(-1 * (130 + 64))}`
    }

    return ''
  }
}
