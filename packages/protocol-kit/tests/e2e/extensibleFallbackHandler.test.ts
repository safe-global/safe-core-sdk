import {
  safeVersionDeployed,
  setupTests,
  getCompatibilityFallbackHandler,
  getExtensibleFallbackHandler,
  getSafeWithOwners,
  itif
} from '@safe-global/testing-kit'
import Safe, { SafeProvider } from '@safe-global/protocol-kit/index'
import { getExtensibleFallbackHandlerContract } from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { SafeVersion } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import semverSatisfies from 'semver/functions/satisfies.js'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

const ONLY_V1_5_0 = semverSatisfies(safeVersionDeployed, '>=1.5.0')

describe('ExtensibleFallbackHandler', () => {
  const provider = getEip1193Provider()

  /**
   * Shared setup: deploys a 1-of-1 Safe with ExtensibleFallbackHandler and
   * returns the Safe SDK, the contract instance, and helpers.
   */
  const buildSetup = async () => {
    const { accounts, contractNetworks, chainId } = await setupTests()
    const [account1] = accounts
    const extensibleFallbackHandler = (await getExtensibleFallbackHandler())!

    const safe = await getSafeWithOwners(
      [account1.address],
      1,
      extensibleFallbackHandler.contract.address
    )
    const safeAddress = safe.address

    const safeSdk = await Safe.init({ provider, safeAddress, contractNetworks })

    const safeProvider = new SafeProvider({ provider })
    const safeVersion: SafeVersion = '1.5.0'
    const customContracts = contractNetworks[chainId.toString()]

    const extensibleFallbackHandlerContract = await getExtensibleFallbackHandlerContract({
      safeProvider,
      safeVersion,
      customContracts
    })

    return {
      safeAddress,
      safeSdk,
      extensibleFallbackHandlerContract,
      extensibleFallbackHandler
    }
  }

  /**
   * Encodes a (isStatic, selector, handler) triple into a bytes32 value using the
   * MarshalLib format expected by addSupportedInterfaceBatch:
   *   byte 0      : isStatic flag (0x00 = static, 0x01 = non-static/dynamic)
   *   bytes 1–4   : 4-byte function selector
   *   bytes 5–11  : zero padding (7 bytes)
   *   bytes 12–31 : handler address (20 bytes)
   */
  const encodeHandlerWithSelector = (
    selector: string, // e.g. '0xaabbccdd'
    handlerAddress: string, // checksummed or lowercase, with 0x prefix
    isStatic = true
  ): `0x${string}` => {
    // MarshalLib: byte 0 is 0x00 for static, 0x01 for non-static
    const isStaticByte = isStatic ? '00' : '01'
    const sel = selector.slice(2).toLowerCase().padStart(8, '0')
    const addr = handlerAddress.slice(2).toLowerCase().padStart(40, '0')
    return `0x${isStaticByte}${sel}${'00'.repeat(7)}${addr}` as `0x${string}`
  }

  /**
   * Computes the ERC-165 interface ID as the XOR of all provided 4-byte selectors.
   * This is the value that must be passed as the first argument to
   * addSupportedInterfaceBatch / removeSupportedInterfaceBatch.
   */
  const computeInterfaceId = (...selectors: string[]): `0x${string}` => {
    let id = 0
    for (const sel of selectors) {
      // Use >>> 0 to keep the result as an unsigned 32-bit integer
      id = (id ^ parseInt(sel, 16)) >>> 0
    }
    return `0x${id.toString(16).padStart(8, '0')}` as `0x${string}`
  }

  describe('read methods', () => {
    itif(ONLY_V1_5_0)('safeInterfaces: should return false for an unknown interface', async () => {
      const { safeAddress, extensibleFallbackHandlerContract } = await buildSetup()

      const [isSupported] = await extensibleFallbackHandlerContract.safeInterfaces([
        safeAddress as `0x${string}`,
        '0x01234567'
      ])

      chai.expect(isSupported).to.be.false
    })

    itif(ONLY_V1_5_0)(
      'safeMethods: should return zero bytes for an unregistered selector',
      async () => {
        const { safeAddress, extensibleFallbackHandlerContract } = await buildSetup()

        const [method] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          '0x12345678'
        ])

        chai
          .expect(method)
          .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000')
      }
    )

    itif(ONLY_V1_5_0)(
      'domainVerifiers: should return zero address for an unregistered domain',
      async () => {
        const { safeAddress, extensibleFallbackHandlerContract } = await buildSetup()

        const domainSeparator = `0x${'ab'.repeat(32)}` as `0x${string}`
        const [verifier] = await extensibleFallbackHandlerContract.domainVerifiers([
          safeAddress as `0x${string}`,
          domainSeparator
        ])

        chai.expect(verifier).to.be.eq('0x0000000000000000000000000000000000000000')
      }
    )

    itif(ONLY_V1_5_0)(
      'supportsInterface: should return false for an unknown interface',
      async () => {
        const { extensibleFallbackHandlerContract } = await buildSetup()

        const [isSupported] = await extensibleFallbackHandlerContract.supportsInterface([
          '0xdeadbeef'
        ])

        chai.expect(isSupported).to.be.false
      }
    )
  })

  describe('write methods (via Safe transactions)', () => {
    itif(ONLY_V1_5_0)(
      'setSafeMethod: should register a method handler and read it back',
      async () => {
        const {
          safeAddress,
          safeSdk,
          extensibleFallbackHandlerContract,
          extensibleFallbackHandler
        } = await buildSetup()

        const selector = '0xaabbccdd' as `0x${string}`
        // Pack handler address into bytes32 (right-aligned, left-padded with zeros)
        const handlerAddress = extensibleFallbackHandler.contract.address.toLowerCase().slice(2)
        const newMethod = `0x${'00'.repeat(12)}${handlerAddress}` as `0x${string}`

        // Verify initial state
        const [methodBefore] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          selector
        ])
        chai
          .expect(methodBefore)
          .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000')

        // Build and execute the Safe transaction calling setSafeMethod on the handler.
        // The tx must target the Safe itself so the call routes through the Safe's
        // FallbackManager to EFH, satisfying the onlySelf modifier.
        const encodedData = extensibleFallbackHandlerContract.encode('setSafeMethod', [
          selector,
          newMethod
        ])
        const tx = await safeSdk.createTransaction({
          transactions: [
            {
              to: safeAddress,
              value: '0',
              data: encodedData
            }
          ]
        })
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)

        // Verify the method was registered for the Safe
        const [methodAfter] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          selector
        ])
        chai.expect(methodAfter.toLowerCase()).to.be.eq(newMethod.toLowerCase())
      }
    )

    itif(ONLY_V1_5_0)(
      'setSupportedInterface: should mark an interface as supported and read it back',
      async () => {
        const { safeAddress, safeSdk, extensibleFallbackHandlerContract } = await buildSetup()

        const interfaceId = '0x11223344' as `0x${string}`

        // Verify not supported initially
        const [supportedBefore] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          interfaceId
        ])
        chai.expect(supportedBefore).to.be.false

        // Target the Safe itself so the call routes through FallbackManager to EFH.
        const encodedData = extensibleFallbackHandlerContract.encode('setSupportedInterface', [
          interfaceId,
          true
        ])
        const tx = await safeSdk.createTransaction({
          transactions: [
            {
              to: safeAddress,
              value: '0',
              data: encodedData
            }
          ]
        })
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)

        // Verify the interface is now supported for the Safe
        const [supportedAfter] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          interfaceId
        ])
        chai.expect(supportedAfter).to.be.true
      }
    )

    itif(ONLY_V1_5_0)(
      'setDomainVerifier: should register a domain verifier and read it back',
      async () => {
        const {
          safeAddress,
          safeSdk,
          extensibleFallbackHandlerContract,
          extensibleFallbackHandler
        } = await buildSetup()

        const domainSeparator = `0x${'cd'.repeat(32)}` as `0x${string}`
        const verifierAddress = extensibleFallbackHandler.contract.address as `0x${string}`

        // Verify no verifier initially
        const [verifierBefore] = await extensibleFallbackHandlerContract.domainVerifiers([
          safeAddress as `0x${string}`,
          domainSeparator
        ])
        chai.expect(verifierBefore).to.be.eq('0x0000000000000000000000000000000000000000')

        // Target the Safe itself so the call routes through FallbackManager to EFH.
        const encodedData = extensibleFallbackHandlerContract.encode('setDomainVerifier', [
          domainSeparator,
          verifierAddress
        ])
        const tx = await safeSdk.createTransaction({
          transactions: [
            {
              to: safeAddress,
              value: '0',
              data: encodedData
            }
          ]
        })
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)

        // Verify the domain verifier was registered for the Safe
        const [verifierAfter] = await extensibleFallbackHandlerContract.domainVerifiers([
          safeAddress as `0x${string}`,
          domainSeparator
        ])
        chai.expect(verifierAfter.toLowerCase()).to.be.eq(verifierAddress.toLowerCase())
      }
    )

    itif(ONLY_V1_5_0)(
      'addSupportedInterfaceBatch: should bulk-register method handlers and mark the interface as supported',
      async () => {
        const {
          safeAddress,
          safeSdk,
          extensibleFallbackHandlerContract,
          extensibleFallbackHandler
        } = await buildSetup()

        const selector1 = '0x11223344' as `0x${string}`
        const selector2 = '0x55667788' as `0x${string}`
        // Interface ID must be the XOR of all selectors in the batch (ERC-165 rule enforced by EFH)
        const expectedInterfaceId = computeInterfaceId(selector1, selector2) // 0x444444cc

        // Build handlerWithSelectors entries using the MarshalLib encoding:
        //   byte 0      : isStatic flag (0x00)
        //   bytes 1–4   : 4-byte selector
        //   bytes 5–11  : zeros (7 bytes)
        //   bytes 12–31 : handler address (20 bytes)
        const entry1 = encodeHandlerWithSelector(
          selector1,
          extensibleFallbackHandler.contract.address
        )
        const entry2 = encodeHandlerWithSelector(
          selector2,
          extensibleFallbackHandler.contract.address
        )

        // Verify initial state
        const [ifBefore] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          expectedInterfaceId
        ])
        chai.expect(ifBefore).to.be.false

        // Execute addSupportedInterfaceBatch via a Safe transaction.
        // Target the Safe itself so the call routes through FallbackManager to EFH.
        const encodedData = extensibleFallbackHandlerContract.encode('addSupportedInterfaceBatch', [
          expectedInterfaceId,
          [entry1, entry2]
        ])
        const tx = await safeSdk.createTransaction({
          transactions: [{ to: safeAddress, value: '0', data: encodedData }]
        })
        await waitSafeTxReceipt(await safeSdk.executeTransaction(tx))

        // Interface should now be supported
        const [ifAfter] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          expectedInterfaceId
        ])
        chai.expect(ifAfter).to.be.true

        // Both selectors should be registered to the handler
        const [method1] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          selector1
        ])
        chai
          .expect(method1.toLowerCase())
          .to.include(extensibleFallbackHandler.contract.address.toLowerCase().slice(2))

        const [method2] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          selector2
        ])
        chai
          .expect(method2.toLowerCase())
          .to.include(extensibleFallbackHandler.contract.address.toLowerCase().slice(2))
      }
    )

    itif(ONLY_V1_5_0)(
      'removeSupportedInterfaceBatch: should un-register method handlers and remove interface support',
      async () => {
        const {
          safeAddress,
          safeSdk,
          extensibleFallbackHandlerContract,
          extensibleFallbackHandler
        } = await buildSetup()

        const selector1 = '0xaabb1122' as `0x${string}`
        // Interface ID must be the XOR of the selector(s) in the batch
        const batchInterfaceId = computeInterfaceId(selector1) // == selector1 for single entry
        const entry1 = encodeHandlerWithSelector(
          selector1,
          extensibleFallbackHandler.contract.address
        )

        // First: add the interface via addSupportedInterfaceBatch.
        // Target the Safe itself so the call routes through FallbackManager to EFH.
        const addData = extensibleFallbackHandlerContract.encode('addSupportedInterfaceBatch', [
          batchInterfaceId,
          [entry1]
        ])
        const addTx = await safeSdk.createTransaction({
          transactions: [{ to: safeAddress, value: '0', data: addData }]
        })
        await waitSafeTxReceipt(await safeSdk.executeTransaction(addTx))

        // Confirm it was added
        const [isAddedBefore] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          batchInterfaceId
        ])
        chai.expect(isAddedBefore).to.be.true

        // Now remove via removeSupportedInterfaceBatch.
        // Target the Safe itself so the call routes through FallbackManager to EFH.
        const removeData = extensibleFallbackHandlerContract.encode(
          'removeSupportedInterfaceBatch',
          [batchInterfaceId, [selector1]]
        )
        const removeTx = await safeSdk.createTransaction({
          transactions: [{ to: safeAddress, value: '0', data: removeData }]
        })
        await waitSafeTxReceipt(await safeSdk.executeTransaction(removeTx))

        // Interface should no longer be supported
        const [isRemovedAfter] = await extensibleFallbackHandlerContract.safeInterfaces([
          safeAddress as `0x${string}`,
          batchInterfaceId
        ])
        chai.expect(isRemovedAfter).to.be.false

        // Method should be zeroed out
        const [methodAfter] = await extensibleFallbackHandlerContract.safeMethods([
          safeAddress as `0x${string}`,
          selector1
        ])
        chai
          .expect(methodAfter)
          .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000')
      }
    )
  })

  describe('version guard (Safe < v1.5.0)', () => {
    const NOT_V1_5_0 = !ONLY_V1_5_0

    /**
     * Shared setup for pre-1.5.0 Safes: deploys a 1-of-1 Safe using the
     * CompatibilityFallbackHandler so getContractVersion() returns < v1.5.0.
     */
    const buildOldSetup = async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const cfh = await getCompatibilityFallbackHandler()
      const safe = await getSafeWithOwners([account1.address], 1, cfh.contract.address)
      const safeSdk = await Safe.init({
        provider,
        safeAddress: safe.address,
        contractNetworks
      })
      return { safeSdk }
    }

    itif(NOT_V1_5_0)('getSafeMethod: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(safeSdk.getSafeMethod('0x12345678'))
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)('getDomainVerifier: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(safeSdk.getDomainVerifier(`0x${'ab'.repeat(32)}`))
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)('isSafeInterfaceSupported: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(safeSdk.isSafeInterfaceSupported('0xdeadbeef'))
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)('createSetSafeMethodTx: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(safeSdk.createSetSafeMethodTx('0xaabbccdd', `0x${'00'.repeat(32)}`))
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)('createSetDomainVerifierTx: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(
          safeSdk.createSetDomainVerifierTx(
            `0x${'cd'.repeat(32)}`,
            '0x0000000000000000000000000000000000000001'
          )
        )
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)('createSetSupportedInterfaceTx: should throw on Safe < v1.5.0', async () => {
      const { safeSdk } = await buildOldSetup()
      await chai
        .expect(safeSdk.createSetSupportedInterfaceTx('0x11223344', true))
        .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
    })

    itif(NOT_V1_5_0)(
      'createAddSupportedInterfaceBatchTx: should throw on Safe < v1.5.0',
      async () => {
        const { safeSdk } = await buildOldSetup()
        await chai
          .expect(safeSdk.createAddSupportedInterfaceBatchTx('0xaabbccdd', []))
          .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
      }
    )

    itif(NOT_V1_5_0)(
      'createRemoveSupportedInterfaceBatchTx: should throw on Safe < v1.5.0',
      async () => {
        const { safeSdk } = await buildOldSetup()
        await chai
          .expect(safeSdk.createRemoveSupportedInterfaceBatchTx('0xaabbccdd', []))
          .to.be.rejectedWith('ExtensibleFallbackHandler is only available for Safe >= v1.5.0')
      }
    )
  })

  describe('Safe.ts helper methods', () => {
    // ---- read helpers ----

    itif(ONLY_V1_5_0)(
      'getSafeMethod: should return zero bytes for an unregistered selector',
      async () => {
        const { safeSdk } = await buildSetup()

        const method = await safeSdk.getSafeMethod('0x12345678')

        chai
          .expect(method)
          .to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000')
      }
    )

    itif(ONLY_V1_5_0)(
      'getDomainVerifier: should return zero address for an unregistered domain separator',
      async () => {
        const { safeSdk } = await buildSetup()

        const verifier = await safeSdk.getDomainVerifier(`0x${'ab'.repeat(32)}`)

        chai.expect(verifier).to.be.eq('0x0000000000000000000000000000000000000000')
      }
    )

    itif(ONLY_V1_5_0)(
      'isSafeInterfaceSupported: should return false for an unknown interface',
      async () => {
        const { safeSdk } = await buildSetup()

        const isSupported = await safeSdk.isSafeInterfaceSupported('0xdeadbeef')

        chai.expect(isSupported).to.be.false
      }
    )

    // ---- write transaction builders ----

    itif(ONLY_V1_5_0)(
      'createSetSafeMethodTx: should register a method handler and be readable via getSafeMethod',
      async () => {
        const { safeSdk, extensibleFallbackHandler } = await buildSetup()

        const selector = '0xaabbccdd'
        const handlerAddr = extensibleFallbackHandler.contract.address.toLowerCase().slice(2)
        const newMethod = `0x${'00'.repeat(12)}${handlerAddr}`

        const tx = await safeSdk.createSetSafeMethodTx(selector, newMethod)
        await waitSafeTxReceipt(await safeSdk.executeTransaction(tx))

        const method = await safeSdk.getSafeMethod(selector)
        chai.expect(method.toLowerCase()).to.be.eq(newMethod.toLowerCase())
      }
    )

    itif(ONLY_V1_5_0)(
      'createSetDomainVerifierTx: should register a domain verifier and be readable via getDomainVerifier',
      async () => {
        const { safeSdk, extensibleFallbackHandler } = await buildSetup()

        const domainSeparator = `0x${'cd'.repeat(32)}`
        const verifierAddress = extensibleFallbackHandler.contract.address

        const tx = await safeSdk.createSetDomainVerifierTx(domainSeparator, verifierAddress)
        await waitSafeTxReceipt(await safeSdk.executeTransaction(tx))

        const verifier = await safeSdk.getDomainVerifier(domainSeparator)
        chai.expect(verifier.toLowerCase()).to.be.eq(verifierAddress.toLowerCase())
      }
    )

    itif(ONLY_V1_5_0)(
      'createSetSupportedInterfaceTx: should toggle interface support readable via isSafeInterfaceSupported',
      async () => {
        const { safeSdk } = await buildSetup()

        const interfaceId = '0x11223344'

        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.false

        // Enable
        const enableTx = await safeSdk.createSetSupportedInterfaceTx(interfaceId, true)
        await waitSafeTxReceipt(await safeSdk.executeTransaction(enableTx))
        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.true

        // Disable
        const disableTx = await safeSdk.createSetSupportedInterfaceTx(interfaceId, false)
        await waitSafeTxReceipt(await safeSdk.executeTransaction(disableTx))
        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.false
      }
    )

    itif(ONLY_V1_5_0)(
      'createAddSupportedInterfaceBatchTx: should bulk-register handlers and mark interface supported',
      async () => {
        const { safeSdk, extensibleFallbackHandler } = await buildSetup()

        const selector = '0x99887766'
        // For a single-selector batch, interfaceId = XOR of selectors = the selector itself
        const interfaceId = computeInterfaceId(selector) // == '0x99887766'
        const handlerEntry = encodeHandlerWithSelector(
          selector,
          extensibleFallbackHandler.contract.address
        )

        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.false

        const tx = await safeSdk.createAddSupportedInterfaceBatchTx(interfaceId, [handlerEntry])
        await waitSafeTxReceipt(await safeSdk.executeTransaction(tx))

        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.true

        const method = await safeSdk.getSafeMethod(selector)
        chai
          .expect(method.toLowerCase())
          .to.include(extensibleFallbackHandler.contract.address.toLowerCase().slice(2))
      }
    )

    itif(ONLY_V1_5_0)(
      'createRemoveSupportedInterfaceBatchTx: should un-register handlers and remove interface support',
      async () => {
        const { safeSdk, extensibleFallbackHandler } = await buildSetup()

        const selector = '0xaacacaca'
        // For a single-selector batch, interfaceId = XOR of selectors = the selector itself
        const interfaceId = computeInterfaceId(selector) // == '0xaacacaca'
        const handlerEntry = encodeHandlerWithSelector(
          selector,
          extensibleFallbackHandler.contract.address
        )

        // First add
        const addTx = await safeSdk.createAddSupportedInterfaceBatchTx(interfaceId, [handlerEntry])
        await waitSafeTxReceipt(await safeSdk.executeTransaction(addTx))
        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.true

        // Then remove
        const removeTx = await safeSdk.createRemoveSupportedInterfaceBatchTx(interfaceId, [
          selector
        ])
        await waitSafeTxReceipt(await safeSdk.executeTransaction(removeTx))
        chai.expect(await safeSdk.isSafeInterfaceSupported(interfaceId)).to.be.false
      }
    )
  })
})
