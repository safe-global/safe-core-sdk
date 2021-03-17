export interface SafeSignature {
  signer: string
  data: string
  staticPart(/* dynamicOffset: number */): string
  dynamicPart(): string
}

export class EthSignSignature implements SafeSignature {
  signer: string
  data: string

  constructor(signer: string, signature: string) {
    this.signer = signer
    this.data = signature
      .replace('0x', '')
      .replace(/00$/, '1f')
      .replace(/1b$/, '1f')
      .replace(/01$/, '20')
      .replace(/1c$/, '20')
  }

  staticPart(/* dynamicOffset: number */) {
    return this.data
  }

  dynamicPart() {
    return ''
  }
}
