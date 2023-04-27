import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import dotenv from 'dotenv'
import { ethers } from 'ethers'
import { SafeEthersSigner, SafeService } from '../src'

dotenv.config()

const sample = async () => {
  console.log('Setup provider')
  const provider = new JsonRpcProvider(process.env.JSON_RPC!)
  console.log('Setup SafeService')
  const service = new SafeService(process.env.SERVICE_URL!)
  console.log('Setup Signer')
  const signerOrProvider = new Wallet(process.env.SIGNER_KEY!, provider)
  console.log('Setup SafeEthersSigner')
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider })
  const safe = await Safe.create({ ethAdapter, safeAddress: process.env.DEPLOYER_SAFE! })
  const safeSigner = await SafeEthersSigner.create(safe, service, provider)
  const contract = new Contract(
    '0xe50c6391a6cb10f9B9Ef599aa1C68C82dD88Bd91',
    ['function pin(string newMessage)'],
    safeSigner
  )
  const proposedTx = await contract.functions.pin(`Local time: ${new Date().toLocaleString()}`)
  console.log('USER ACTION REQUIRED')
  console.log('Go to the Safe Web App to confirm the transaction')
  console.log(await proposedTx.wait())
  console.log('Transaction has been executed')
}

sample()
