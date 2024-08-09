import { Chain, Account, Transport, WalletClient } from 'viem'

export async function signDelegate(
  walletClient: WalletClient<Transport, Chain, Account>,
  delegateAddress: string,
  chainId: bigint
) {
  const domain = {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: Number(chainId)
  }

  const types = {
    Delegate: [
      { name: 'delegateAddress', type: 'address' },
      { name: 'totp', type: 'uint256' }
    ]
  }

  const totp = Math.floor(Date.now() / 1000 / 3600)

  return walletClient.signTypedData({
    domain,
    types,
    primaryType: 'Delegate',
    message: { delegateAddress, totp }
  })
}
