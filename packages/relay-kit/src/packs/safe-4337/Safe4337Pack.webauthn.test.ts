import * as viem from 'viem'
import Safe, * as protocolKit from '@safe-global/protocol-kit'
import { getSafe4337ModuleDeployment } from '@safe-global/safe-modules-deployments'
import { Safe4337Pack } from './Safe4337Pack'
import * as constants from './constants'
import {
  fixtures,
  generateTransferCallData
} from '@safe-global/relay-kit/test-utils'

// Hermetic regression test for https://github.com/safe-global/safe-core-sdk/issues/1251.
// Standalone so it runs without the repository secrets (PRIVATE_KEY / PASSKEY_PRIVATE_KEY)
// and without network access: the Safe is fully stubbed and the bundler client is mocked.

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  createBundlerClient: jest.fn(() => ({ request: requestMock }))
}))

const requestResponseMap = {
  [constants.RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS]: [
    fixtures.ENTRYPOINT_ADDRESS_V06,
    fixtures.ENTRYPOINT_ADDRESS_V07
  ],
  [constants.RPC_4337_CALLS.CHAIN_ID]: fixtures.CHAIN_ID,
  [constants.RPC_4337_CALLS.SEND_USER_OPERATION]: fixtures.USER_OPERATION_HASH,
  [constants.RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS]: fixtures.GAS_ESTIMATION,
  [constants.RPC_4337_CALLS.GET_USER_OPERATION_BY_HASH]: fixtures.USER_OPERATION_BY_HASH,
  [constants.RPC_4337_CALLS.GET_USER_OPERATION_RECEIPT]: fixtures.USER_OPERATION_RECEIPT,
  ['pimlico_getUserOperationGasPrice']: fixtures.USER_OPERATION_GAS_PRICE
}

const requestMock = jest.fn(async ({ method }: { method: keyof typeof requestResponseMap }) => {
  return requestResponseMap[method]
})

describe('Safe4337Pack with an existing Safe and a passkey signer', () => {
  let safe4337ModuleAddress: viem.Hash

  beforeAll(() => {
    const network = parseInt(fixtures.CHAIN_ID).toString()
    safe4337ModuleAddress = getSafe4337ModuleDeployment({
      released: true,
      version: '0.3.0',
      network
    })?.networkAddresses[network] as viem.Hash
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should resolve the WebAuthn shared signer address used in the dummy signature for gas estimation', async () => {
    // SafeWebAuthnSharedSigner deployment address for Sepolia (chainId 11155111)
    const SAFE_WEBAUTHN_SHARED_SIGNER_ADDRESS = '0x94a4F6affBd8975951142c3999aEAB7ecee555c2'

    // Stub the protocolKit (no real RPC calls) and simulate a passkey signer so the
    // shared signer address is resolved for an existing Safe, not only for predicted Safes.
    const safeProviderMock = {
      isPasskeySigner: jest.fn().mockResolvedValue(true),
      readContract: jest.fn().mockResolvedValue(1n),
      getChainId: jest.fn().mockResolvedValue(11155111n)
    }
    const protocolKitMock = {
      getSafeProvider: jest.fn(() => safeProviderMock),
      getContractVersion: jest.fn(() => '1.4.1'),
      getModules: jest.fn(async () => [safe4337ModuleAddress]),
      getFallbackHandler: jest.fn(async () => safe4337ModuleAddress),
      getThreshold: jest.fn(async () => 1),
      getAddress: jest.fn(async () => fixtures.SAFE_ADDRESS_v1_4_1_WITH_0_3_0_MODULE),
      isSafeDeployed: jest.fn(async () => true),
      getChainId: jest.fn(async () => 11155111n),
      // Safe 1.4.1 MultiSendCallOnly on Sepolia; only the address string is used here
      // (the gas-estimation assertion below checks the dummy signature, not the calldata)
      getMultiSendAddress: jest.fn(async () => '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    }

    jest.spyOn(Safe, 'init').mockResolvedValue(protocolKitMock as unknown as Safe)

    const safe4337Pack = await Safe4337Pack.init({
      provider: fixtures.RPC_URL,
      safeModulesVersion: '0.3.0',
      options: {
        safeAddress: fixtures.SAFE_ADDRESS_v1_4_1_WITH_0_3_0_MODULE
      },
      bundlerUrl: fixtures.BUNDLER_URL
    })

    const transferUSDC = {
      to: fixtures.PAYMASTER_TOKEN_ADDRESS,
      data: generateTransferCallData(fixtures.SAFE_ADDRESS_v1_4_1_WITH_0_3_0_MODULE, 100_000n),
      value: '0',
      operation: 0
    }

    await safe4337Pack.createTransaction({ transactions: [transferUSDC] })

    // The dummy signature used for the gas estimation must contain the WebAuthn shared
    // signer address. Before the fix it was left as the zero address, causing bundlers
    // to reject the estimation (AA33 revert).
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: constants.RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS,
        params: expect.arrayContaining([
          expect.objectContaining({
            signature: expect.stringMatching(
              new RegExp(SAFE_WEBAUTHN_SHARED_SIGNER_ADDRESS.toLowerCase().slice(2), 'i')
            )
          })
        ])
      })
    )

    // The passkey check must run when initializing with an existing Safe
    expect(safeProviderMock.isPasskeySigner).toHaveBeenCalled()
  })
})
