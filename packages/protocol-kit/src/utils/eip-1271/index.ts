import Safe, { getCompatibilityFallbackHandlerContract } from '@safe-global/protocol-kit/index'

export const MAGIC_VALUE = '0x1626ba7e'

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

  try {
    const isValidSignatureResponse = await ethAdapter.call({
      from: safeAddress,
      to: safeAddress,
      data: eip1271data
    })

    return isValidSignatureResponse.slice(0, 10).toLowerCase() === MAGIC_VALUE
  } catch (error) {
    console.error(error)
    return false
  }
}
