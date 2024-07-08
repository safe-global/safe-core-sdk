import { viem } from 'hardhat'
import { WalletClient, Chain, Transport, Account as ViemAccount } from 'viem'
interface Account {
  signer: WalletClient<Transport, Chain, ViemAccount>
  address: string
}

async function getHardhatAccounts(): Promise<Account[]> {
  const wallets = await viem.getWalletClients()

  const accounts: Account[] = []

  for (let i = 0; i < 10; i++) {
    const wallet = wallets[i]
    const account: Account = { signer: wallet, address: wallet.account.address }
    accounts.push(account)
  }

  return accounts
}

export async function getAccounts(): Promise<Account[]> {
  const accounts = await getHardhatAccounts()
  return accounts
}
