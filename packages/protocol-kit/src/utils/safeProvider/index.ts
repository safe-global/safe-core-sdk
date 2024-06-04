import {
  ContractNetworksConfig,
  PasskeySigner,
  SafeConfig,
  SafeProvider,
  getSafeWebAuthnSignerFactoryContract
} from '../..'

/**
 * Initializes the Safe Provider instance.
 * @param provider - Safe provider
 * @param signer - Safe signer
 * @param contractNetworks - custom contracts
 * @returns The Safe Provider instance.
 */
export async function createSafeProvider(
  provider: SafeConfig['provider'],
  signer?: SafeConfig['signer'],
  contractNetworks?: ContractNetworksConfig
): Promise<SafeProvider> {
  const isPasskeySigner = signer && typeof signer !== 'string'

  if (isPasskeySigner) {
    const safeProvider = new SafeProvider({
      provider
    })
    const chainId = await safeProvider.getChainId()
    const customContracts = contractNetworks?.[chainId.toString()]

    const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
      safeProvider,
      safeVersion: '1.4.1',
      customContracts
    })

    const passkeySigner = await PasskeySigner.init(
      signer,
      safeWebAuthnSignerFactoryContract,
      safeProvider.getExternalProvider()
    )

    return new SafeProvider({
      provider,
      signer: passkeySigner
    })
  } else {
    return new SafeProvider({
      provider,
      signer
    })
  }
}
