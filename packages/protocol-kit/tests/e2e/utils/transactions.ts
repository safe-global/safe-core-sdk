import { GetTransactionReceiptReturnType, Hex, WalletClient, Transport, Chain, Account } from 'viem'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import hre, { viem } from 'hardhat'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<GetTransactionReceiptReturnType | null | undefined> {
  const receipt: GetTransactionReceiptReturnType | null | undefined =
    txResult.transactionResponse && (await txResult?.transactionResponse?.wait())

  return receipt
}

export async function getTransaction(
  safeProvider: SafeProvider,
  transactionHash: string
): Promise<any> {
  return safeProvider.getTransaction(transactionHash)
}

export async function waitTransactionReceipt(hash: Hex) {
  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash })
}

export async function getDeployer(): Promise<WalletClient<Transport, Chain, Account>> {
  const { deployer } = await hre.getNamedAccounts()
  return viem.getWalletClient(deployer)
}
