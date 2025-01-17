import {
  Hex,
  hexToBytes,
  encodeAbiParameters,
  toHex,
  toBytes,
  stringToBytes,
  SignableMessage,
  isHex,
  createClient,
  custom,
  walletActions,
  maxUint256,
  Client,
  fromBytes,
  fromHex,
  parseAbiParameters,
  encodeFunctionData,
  parseAbi
} from 'viem'
import {
  PasskeyArgType,
  PasskeyClient,
  SafeWebAuthnSignerFactoryContractImplementationType,
  SafeWebAuthnSharedSignerContractImplementationType,
  GetPasskeyCredentialFn
} from '@safe-global/protocol-kit/types'
import { getDefaultFCLP256VerifierAddress } from './extractPasskeyData'
import { asHex } from '../types'
import isSharedSigner from './isSharedSigner'

export const PASSKEY_CLIENT_KEY = 'passkeyWallet'
export const PASSKEY_CLIENT_NAME = 'Passkey Wallet Client'

const sign = async (
  passkeyRawId: Uint8Array,
  data: Uint8Array,
  getFn?: GetPasskeyCredentialFn
): Promise<Hex> => {
  // Avoid loosing the context for navigator.credentials.get function that leads to an error
  const getCredentials = getFn || navigator.credentials.get.bind(navigator.credentials)

  const assertion = (await getCredentials({
    publicKey: {
      challenge: data,
      allowCredentials: [{ type: 'public-key', id: passkeyRawId }],
      userVerification: 'required'
    }
  })) as PublicKeyCredential

  const assertionResponse = assertion.response as AuthenticatorAssertionResponse

  if (!assertionResponse?.authenticatorData) {
    throw new Error('Failed to sign data with passkey Signer')
  }

  const { authenticatorData, signature, clientDataJSON } = assertionResponse

  return encodeAbiParameters(parseAbiParameters('bytes, bytes, uint256[2]'), [
    toHex(new Uint8Array(authenticatorData)),
    extractClientDataFields(clientDataJSON),
    extractSignature(signature)
  ])
}

const signTransaction = () => {
  throw new Error('Passkey Signers cannot sign transactions, they can only sign data.')
}

const signTypedData = () => {
  throw new Error('Passkey Signers cannot sign signTypedData, they can only sign data.')
}

export const createPasskeyClient = async (
  passkey: PasskeyArgType,
  safeWebAuthnSignerFactoryContract: SafeWebAuthnSignerFactoryContractImplementationType,
  safeWebAuthnSharedSignerContract: SafeWebAuthnSharedSignerContractImplementationType,
  provider: Client,
  safeAddress: string,
  owners: string[],
  chainId: string
) => {
  const { rawId, coordinates, customVerifierAddress } = passkey
  const passkeyRawId = hexToBytes(asHex(rawId))
  const verifierAddress = customVerifierAddress || getDefaultFCLP256VerifierAddress(chainId)

  const isPasskeySharedSigner = await isSharedSigner(
    passkey,
    safeWebAuthnSharedSignerContract,
    safeAddress,
    owners,
    chainId
  )

  let signerAddress

  if (isPasskeySharedSigner) {
    signerAddress = safeWebAuthnSharedSignerContract.getAddress()
  } else {
    ;[signerAddress] = await safeWebAuthnSignerFactoryContract.getSigner([
      BigInt(coordinates.x),
      BigInt(coordinates.y),
      fromHex(asHex(verifierAddress), 'bigint')
    ])
  }

  return createClient({
    account: signerAddress,
    name: PASSKEY_CLIENT_NAME,
    key: PASSKEY_CLIENT_KEY,
    transport: custom(provider.transport)
  })
    .extend(walletActions)
    .extend(() => ({
      signMessage({ message }: { message: SignableMessage }) {
        if (typeof message === 'string') {
          return sign(passkeyRawId, toBytes(message), passkey.getFn)
        }

        return sign(
          passkeyRawId,
          isHex(message.raw) ? toBytes(message.raw) : message.raw,
          passkey.getFn
        )
      },
      signTransaction,
      signTypedData,
      encodeConfigure() {
        return encodeFunctionData({
          abi: parseAbi(['function configure((uint256 x, uint256 y, uint176 verifiers) signer)']),
          functionName: 'configure',
          args: [
            {
              x: BigInt(passkey.coordinates.x),
              y: BigInt(passkey.coordinates.y),
              verifiers: fromHex(asHex(verifierAddress), 'bigint')
            }
          ]
        })
      },
      encodeCreateSigner() {
        return asHex(
          safeWebAuthnSignerFactoryContract.encode('createSigner', [
            BigInt(coordinates.x),
            BigInt(coordinates.y),
            BigInt(verifierAddress)
          ])
        )
      },
      createDeployTxRequest() {
        const passkeySignerDeploymentTransaction = {
          to: safeWebAuthnSignerFactoryContract.getAddress(),
          value: '0',
          data: this.encodeCreateSigner()
        }

        return passkeySignerDeploymentTransaction
      }
    })) as PasskeyClient
}

function decodeClientDataJSON(clientDataJSON: ArrayBuffer): string {
  const uint8Array = new Uint8Array(clientDataJSON)

  let result = ''
  for (let i = 0; i < uint8Array.length; i++) {
    result += String.fromCharCode(uint8Array[i])
  }

  return result
}

/**
 * Compute the additional client data JSON fields. This is the fields other than `type` and
 * `challenge` (including `origin` and any other additional client data fields that may be
 * added by the authenticator).
 *
 * See <https://w3c.github.io/webauthn/#clientdatajson-serialization>
 *
 * @param {ArrayBuffer} clientDataJSON - The client data JSON.
 * @returns {Hex} A hex string of the additional fields from the client data JSON.
 * @throws {Error} Throws an error if the client data JSON does not contain the expected 'challenge' field pattern.
 */
function extractClientDataFields(clientDataJSON: ArrayBuffer): Hex {
  const decodedClientDataJSON = decodeClientDataJSON(clientDataJSON)

  const match = decodedClientDataJSON.match(
    /^\{"type":"webauthn.get","challenge":"[A-Za-z0-9\-_]{43}",(.*)\}$/
  )

  if (!match) {
    throw new Error('challenge not found in client data JSON')
  }

  const [, fields] = match
  return toHex(stringToBytes(fields))
}

/**
 * Extracts the numeric values r and s from a DER-encoded ECDSA signature.
 * This function decodes the signature based on a specific format and validates the encoding at each step.
 *
 * @param {ArrayBuffer | Uint8Array | Array<number>} signature - The DER-encoded signature to be decoded. The WebAuthn standard expects the signature to be an ArrayBuffer, but some password managers (including Bitwarden) provide a Uint8Array or an array of numbers instead.
 * @returns {[bigint, bigint]} A tuple containing two BigInt values, r and s, which are the numeric values extracted from the signature.
 * @throws {Error} Throws an error if the signature encoding is invalid or does not meet expected conditions.
 */
function extractSignature(signature: ArrayBuffer | Uint8Array | Array<number>): [bigint, bigint] {
  const check = (x: boolean) => {
    if (!x) {
      throw new Error('invalid signature encoding')
    }
  }

  // Decode the DER signature. Note that we assume that all lengths fit into 8-bit integers,
  // which is true for the kinds of signatures we are decoding but generally false. I.e. this
  // code should not be used in any serious application.
  const view = new DataView(
    signature instanceof ArrayBuffer
      ? signature
      : signature instanceof Uint8Array
        ? signature.buffer
        : new Uint8Array(signature).buffer
  )

  // check that the sequence header is valid
  check(view.getUint8(0) === 0x30)
  check(view.getUint8(1) === view.byteLength - 2)

  // read r and s
  const readInt = (offset: number) => {
    check(view.getUint8(offset) === 0x02)
    const len = view.getUint8(offset + 1)
    const start = offset + 2
    const end = start + len
    const n = fromBytes(new Uint8Array(view.buffer.slice(start, end)), 'bigint')
    check(n < maxUint256)
    return [n, end] as const
  }
  const [r, sOffset] = readInt(2)
  const [s] = readInt(sOffset)

  return [r, s]
}
