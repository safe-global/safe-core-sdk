import { Hex, WalletClient, Transport, Chain, Account } from 'viem'
import { Address } from '@safe-global/types-kit'
import hre, { viem } from 'hardhat'

export async function waitTransactionReceipt(hash: Hex) {
  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash })
}

export async function getDeployer(): Promise<WalletClient<Transport, Chain, Account>> {
  const { deployer } = await hre.getNamedAccounts()
  return viem.getWalletClient(deployer as Address)
}
