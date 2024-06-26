import { viem } from 'hardhat'
import { WalletClient } from 'viem'
interface Account {
  signer: WalletClient
  address: string
}

async function getHardhatAccounts(): Promise<Account[]> {
  const wallets = await viem.getWalletClients()

  const accounts: Account[] = []

  for (let i = 0; i < 10; i++) {
    const wallet = wallets[i]
    const account: Account = { signer: wallet, address: (await wallet.getAddresses())[0] }
    accounts.push(account)
  }

  return accounts
}

export async function getAccounts(): Promise<Account[]> {
  const accounts = await getHardhatAccounts()
  return accounts
}
