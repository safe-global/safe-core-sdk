import Safe, { getCompatibilityFallbackHandlerContract } from '@safe-global/protocol-kit'
import { hexToBytes } from 'web3-utils'

export const MAGIC_VALUE = '0x1626ba7e'
export const MAGIC_VALUE_BYTES = '0x20c13b0b'

/**
 *
 * @param messageHash The hash of the message to be signed
 * @param signature The signature to be validated or '0x'
 * @param safeSdk An instance of Safe
 * @returns A boolean indicating if the signature is valid
 * @link https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol
 */
export const validateSignature = async (
  messageHash: string,
  signature: string,
  safeSdk: Safe
): Promise<boolean> => {
  const ethAdapter = safeSdk.getEthAdapter()
  const contractManager = safeSdk.getContractManager()

  const safeAddress = await safeSdk.getAddress()
  const safeVersion = await safeSdk.getContractVersion()
  const chainId = await ethAdapter.getChainId()

  const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    ethAdapter: ethAdapter,
    safeVersion,
    customContracts: contractManager.contractNetworks?.[chainId]
  })

  const eip1271data = compatibilityFallbackHandlerContract.encode(
    'isValidSignature(bytes32,bytes)',
    [messageHash, signature]
  )

  const msgBytes = hexToBytes(messageHash)

  const eip1271BytesData = compatibilityFallbackHandlerContract.encode(
    'isValidSignature(bytes,bytes)',
    [msgBytes, signature]
  )

  try {
    const isValidSignatureResponse = await Promise.all([
      ethAdapter.call({
        from: safeAddress,
        to: safeAddress,
        data: eip1271data
      }),
      ethAdapter.call({
        from: safeAddress,
        to: safeAddress,
        data: eip1271BytesData
      })
    ])

    return (
      !!isValidSignatureResponse.length &&
      (isValidSignatureResponse[0].slice(0, 10).toLowerCase() === MAGIC_VALUE ||
        isValidSignatureResponse[1].slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES)
    )
  } catch (error) {
    console.error(error)

    return false
  }
}
