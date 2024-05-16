import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers } from 'hardhat'
interface Account {
  signer: HardhatEthersSigner
  address: string
}

async function getHardhatAccounts(): Promise<Account[]> {
  const wallets = await ethers.getSigners()

  const accounts: Account[] = []

  for (let i = 0; i < 10; i++) {
    const wallet = wallets[i]
    const account: Account = { signer: wallet, address: wallet.address }
    accounts.push(account)
  }

  return accounts
}

export async function getAccounts(): Promise<Account[]> {
  const accounts = await getHardhatAccounts()
  return accounts
}
