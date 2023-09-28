import { SafeSignature } from '@safe-global/safe-core-sdk-types'

export class EthSafeSignature implements SafeSignature {
  signer: string
  data: string
  isSmartContractSignature: boolean

  /**
   * Creates an instance of a Safe signature.
   *
   * @param signer - Ethers signer
   * @param signature - The Safe signature
   * @returns The Safe signature instance
   */
  constructor(signer: string, signature: string, isSmartContractSignature = false) {
    this.signer = signer
    this.data = signature
    this.isSmartContractSignature = isSmartContractSignature
  }

  /**
   * Returns the static part of the Safe signature.
   *
   * @returns The static part of the Safe signature
   */
  staticPart(dynamicOffset?: string) {
    if (this.isSmartContractSignature) {
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
    if (this.isSmartContractSignature) {
      const dynamicPartLength = (this.data.slice(2).length / 2).toString(16).padStart(64, '0')
      return `${dynamicPartLength}${this.data.slice(2)}`
    }

    return ''
  }
}
