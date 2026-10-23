import { Account, Chain, Hex, Transport, WalletClient } from 'viem'
import { getTotp } from './totp'

/**
 * Signs the EIP-712 typed data the Safe Queue Service requires to delete a pending multisig transaction.
 *
 * @param walletClient - The wallet client of the EOA that proposed the transaction
 * @param safeTxHash - The hash of the Safe transaction to delete
 * @param safeAddress - The Safe address
 * @param chainId - The chain of the Safe
 * @returns The signature
 */
export async function signDeleteTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  safeTxHash: string,
  safeAddress: string,
  chainId: bigint
) {
  const domain = {
    name: 'Safe Queue Service',
    version: '1.0',
    chainId,
    verifyingContract: safeAddress
  }

  const types = {
    DeleteRequest: [
      { name: 'safeTxHash', type: 'bytes32' },
      { name: 'totp', type: 'uint256' }
    ]
  } as const

  return walletClient.signTypedData({
    domain,
    types,
    primaryType: 'DeleteRequest',
    message: { safeTxHash: safeTxHash as Hex, totp: getTotp() }
  })
}
