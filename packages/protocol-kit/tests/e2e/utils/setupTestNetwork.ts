import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import dotenv from 'dotenv'
import { ethers, waffle, Web3 } from 'hardhat'

dotenv.config()

type Network = 'mainnet' | 'goerli' | 'gnosis'

interface Account {
  signer: Signer
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

function getHardhatAccounts(): Account[] {
  const wallets = waffle.provider.getWallets()
  const accounts: Account[] = []
  for (let i = 0; i < 10; i++) {
    const wallet: Wallet = wallets[i]
    const account: Account = { signer: wallet as Signer, address: wallet.address }
    accounts.push(account)
  }
  return accounts
}

export async function getAccounts(): Promise<Account[]> {
  const accounts =
    process.env.TEST_NETWORK === 'ganache' ? await getGanacheAccounts() : getHardhatAccounts()
  return accounts
}

export function getNetworkProvider(network: Network): Provider {
  let rpcUrl: string
  switch (network) {
    case 'gnosis':
      rpcUrl = 'https://rpc.gnosischain.com'
      break
    default:
      rpcUrl = `https://${network}.infura.io/v3/${process.env.INFURA_KEY}`
      break
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  return provider
}
