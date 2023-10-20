import { Signer } from '@ethersproject/abstract-signer'
import SafeApiKit, { AddSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'
import { ethers } from 'ethers'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: Signer

const MESSAGE = 'I am the owner of this safe'

export const calculateSafeMessageHash = (
  safeAddress: string,
  message: string,
  chainId: number
): string => {
  return ethers.utils._TypedDataEncoder.hash(
    { verifyingContract: safeAddress, chainId },
    {
      SafeMessage: [{ type: 'bytes', name: 'message' }]
    },
    { message }
  )
}

describe.only('addMessage', () => {
  before(async () => {
    ;({ safeApiKit, signer } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if safeAddress is empty', async () => {
    await chai
      .expect(
        safeApiKit.addMessage('', {
          message: MESSAGE,
          signature: '0x'
        })
      )
      .to.be.rejectedWith('Invalid safeAddress')
  })

  it('should allow to add an offchain message', async () => {
    const messageHash = ethers.utils.hashMessage(MESSAGE)
    const safeMessageHash = calculateSafeMessageHash(
      '0x9D1E7371852a9baF631Ea115b9815deb97cC3205',
      messageHash,
      await signer.getChainId()
    )

    const signature = await signer.signMessage(safeMessageHash)

    await chai.expect(
      safeApiKit.addMessage('0x9D1E7371852a9baF631Ea115b9815deb97cC3205', {
        message: MESSAGE,
        signature
      })
    ).to.be.fulfilled
  })
})
