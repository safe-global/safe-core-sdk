import { Signer, TypedDataDomain } from '@ethersproject/abstract-signer'
import SafeApiKit, { AddSafeDelegateProps, EIP712TypedData } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'
import { ethers } from 'ethers'
import { EthAdapter } from 'packages/safe-core-sdk-types/dist/src'
import { generateEIP712Signature, generateSignature } from 'packages/protocol-kit/dist/src/utils'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: Signer
let ethAdapter: EthAdapter

const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateMessage = () => `${generateRandomUUID()}: I am the owner of the safe`

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return ethers.utils._TypedDataEncoder.hash(
    typedData.domain as TypedDataDomain,
    types,
    typedData.message
  )
}

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
    ;({ safeApiKit, signer, ethAdapter } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if safeAddress is empty', async () => {
    await chai
      .expect(
        safeApiKit.addMessage('', {
          message: generateMessage(),
          signature: '0x'
        })
      )
      .to.be.rejectedWith('Invalid safeAddress')
  })

  it('should allow to add an offchain message with EIP-191', async () => {
    const message = generateMessage()
    const messageHash = ethers.utils.hashMessage(message)
    const safeMessageHash = calculateSafeMessageHash(
      '0x9D1E7371852a9baF631Ea115b9815deb97cC3205',
      messageHash,
      await signer.getChainId()
    )

    const signature = await generateSignature(ethAdapter, safeMessageHash)

    await chai.expect(
      safeApiKit.addMessage('0x9D1E7371852a9baF631Ea115b9815deb97cC3205', {
        message,
        signature: signature.data
      })
    ).to.be.fulfilled
  })

  it.only('should allow to add an offchain message with EIP-712', async () => {
    const message = {
      domain: {
        chainId: await signer.getChainId(),
        verifyingContract: '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
      },
      types: {
        SafeMessage: [{ name: 'message', type: 'bytes' }]
      },
      message: {
        message: generateMessage()
      }
    }
    const messageHash = hashTypedData(message)
    const safeMessageHash = calculateSafeMessageHash(
      '0x9D1E7371852a9baF631Ea115b9815deb97cC3205',
      messageHash,
      await signer.getChainId()
    )

    const signature = await generateEIP712Signature(ethAdapter, safeMessageHash)

    await chai.expect(
      safeApiKit.addMessage('0x9D1E7371852a9baF631Ea115b9815deb97cC3205', {
        message,
        signature: signature.data
      })
    ).to.be.fulfilled
  })
})
