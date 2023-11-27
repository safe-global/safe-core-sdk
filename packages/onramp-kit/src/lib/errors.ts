type ErrorWithMessage = {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message
}
type GnosisChainSignatureError = { info: { error: { data: string | { data: string } } } }
type EthersSignatureError = { data: string }
type SignatureError = Error & EthersSignatureError & GnosisChainSignatureError

/**
 * Parses the isValidSignature call response from different providers.
 * It extracts and decodes the signature value from the Error object.
 *
 * @param {ProviderSignatureError} error - The error object with the signature data.
 * @returns {string} The signature value.
 * @throws It Will throw an error if the signature cannot be parsed.
 */
export function parseIsValidSignatureErrorResponse(error: SignatureError): string {
  // Ethers v6
  const ethersData = error?.data
  if (ethersData) {
    return decodeSignatureData(ethersData)
  }

  // gnosis-chain
  const gnosisChainProviderData = error?.info?.error?.data

  if (gnosisChainProviderData) {
    const isString = typeof gnosisChainProviderData === 'string'

    const encodedDataResponse = isString ? gnosisChainProviderData : gnosisChainProviderData.data
    return decodeSignatureData(encodedDataResponse)
  }

  // Error message
  const isEncodedDataPresent = error?.message?.includes('0x')

  if (isEncodedDataPresent) {
    return decodeSignatureData(error?.message)
  }

  throw new Error('Could not parse Signature from Error response, Details: ' + error?.message)
}

export function decodeSignatureData(encodedSignatureData: string): string {
  const [, encodedSignature] = encodedSignatureData.split('0x')
  const data = '0x' + encodedSignature

  return data.slice(0, 10).toLowerCase()
}
