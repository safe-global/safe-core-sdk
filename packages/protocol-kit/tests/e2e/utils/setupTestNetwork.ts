import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers, Web3 } from 'hardhat'
interface Account {
  signer: HardhatEthersSigner
  address: string
}

async function getGanacheAccounts(): Promise<Account[]> {
  const web3 = new Web3('http://localhost:8545')
  const provider = new ethers.providers.Web3Provider(web3.currentProvider as any)
  const accounts: Account[] = []
  for (let i = 0; i < 10; i++) {
    const signer = provider.getSigner(i)
    const account: Account = { signer, address: await signer.getAddress() }
    accounts.push(account)
  }
  return accounts
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
  const accounts =
    process.env.TEST_NETWORK === 'ganache' ? await getGanacheAccounts() : await getHardhatAccounts()
  return accounts
}
