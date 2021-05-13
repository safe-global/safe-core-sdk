import { Signer, Wallet } from 'ethers'
import { ethers, waffle, Web3 } from 'hardhat'

interface Account {
  signer: Signer
  address: string
}

async function getGanacheAccounts(): Promise<Account[]> {
  const web3 = new Web3('http://localhost:8545')
  const provider = new ethers.providers.Web3Provider(web3.currentProvider as any)
  const accounts: Account[] = []
  for (let i = 0; i < 10; i++) {
    const signer: Signer = provider.getSigner(i)
    const account: Account = { signer, address: await signer.getAddress() }
    accounts.push(account)
  }
  return accounts
}

function getHardhatAccounts(): Account[] {
  const wallets = waffle.provider.getWallets()
  const accounts: Account[] = []
  for (let i = 0; i < 10; i++) {
    const wallet: Wallet = wallets[i]
    console.log(wallet.address)
    const account: Account = { signer: wallet as Signer, address: wallet.address }
    accounts.push(account)
  }
  return accounts
}

export async function getAccounts(): Promise<Account[]> {
  console.log(process.env.TEST_ENV)
  return process.env.TEST_ENV === 'ganache' ? await getGanacheAccounts() : getHardhatAccounts()
}
