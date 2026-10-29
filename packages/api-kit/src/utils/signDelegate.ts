import { Account, Chain, Transport, WalletClient, zeroAddress } from 'viem'
import { getTotp } from './totp'

export type DelegateAction = 'add' | 'edit' | 'delete'

/**
 * Signs the EIP-712 typed data the Safe Queue Service requires from the delegator to add, edit or delete a delegate.
 *
 * @param walletClient - The delegator wallet client
 * @param delegateAddress - The delegate address, or the zero address to target every delegate of the delegator
 * @param chainId - The chain the delegation is scoped to
 * @param action - The delegate action being signed
 * @param safeAddress - The Safe the delegation is scoped to. When omitted the delegation applies to all the Safes of the delegator
 * @returns The signature
 */
export async function signDelegate(
  walletClient: WalletClient<Transport, Chain, Account>,
  delegateAddress: string,
  chainId: bigint,
  action: DelegateAction,
  safeAddress?: string
) {
  const domain = {
    name: 'Safe Queue Service',
    version: '1.0',
    chainId,
    safe: safeAddress ?? zeroAddress
  }

  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'safe', type: 'address' }
    ],
    Delegate: [
      { name: 'delegateAddress', type: 'address' },
      { name: 'totp', type: 'uint256' },
      { name: 'action', type: 'string' }
    ]
  } as const

  return walletClient.signTypedData({
    domain,
    types,
    primaryType: 'Delegate',
    message: { delegateAddress, totp: getTotp(), action }
  })
}
