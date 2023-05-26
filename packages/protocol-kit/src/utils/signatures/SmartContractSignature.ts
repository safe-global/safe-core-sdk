import { hexlify, hexZeroPad } from 'ethers/lib/utils'
import { SafeSignature } from '@safe-global/safe-core-sdk-types'

export class SmartContractSafeSignature implements SafeSignature {
  signer: string
  data: string

  /**
   * Creates an instance of a Safe signature.
   *
   * @param signer - Ethers signer
   * @param signature - The Safe signature
   * @returns The Safe signature instance
   */
  constructor(signer: string, signature: string) {
    this.signer = signer
    this.data = signature
  }

  /**
   * Returns the static part of the Safe signature.
   *
   * @returns The static part of the Safe signature
   */
  staticPart(dynamicOffset: number) {
    return hexZeroPad(this.signer, 32) + hexZeroPad(hexlify(dynamicOffset), 32).slice(2) + '00'
  }

  /**
   * Returns the dynamic part of the Safe signature.
   *
   * @returns The dynamic part of the Safe signature
   */
  dynamicPart() {
    const byteLength = hexZeroPad(hexlify(this.data.slice(2).length / 2), 32)
    return (byteLength + this.data.slice(2)).slice(2)
  }
}
