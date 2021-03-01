import { EthSignSignature, SafeSignature } from './utils/signatures'

interface SafeSigner {
  sign(hash: string): Promise<SafeSignature>
}

class EthersSafeSigner implements SafeSigner {
  #ethers: any
  #signer: any

  constructor(ethers: any, signer: any) {
    this.#ethers = ethers
    this.#signer = signer
  }

  async sign(hash: string): Promise<SafeSignature> {
    const address = await this.#signer.address
    const messageArray = this.#ethers.utils.arrayify(hash)
    const signature = await this.#signer.signMessage(messageArray)
    return new EthSignSignature(address, signature)
  }
}

export default EthersSafeSigner
