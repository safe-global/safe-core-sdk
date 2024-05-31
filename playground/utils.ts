import { ethers } from 'ethers'
import { Safe4337Pack } from '@safe-global/relay-kit'

export async function waitForOperationToFinish(
  userOperationHash: string,
  chainName: string,
  safe4337Pack: Safe4337Pack
) {
  console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${chainName}`)

  let userOperationReceipt = null
  while (!userOperationReceipt) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOperationHash)
  }

  console.group('User Operation Receipt and hash')
  console.log('User Operation Receipt', userOperationReceipt)
  console.log(
    'User Operation By Hash',
    await safe4337Pack.getUserOperationByHash(userOperationHash)
  )
  console.groupEnd()
}

export function generateTransferCallData(to: string, value: bigint) {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'
  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

export async function transfer(
  signer: ethers.AbstractSigner,
  tokenAddress: string,
  to: string,
  amount: bigint
) {
  const transferEC20 = {
    to: tokenAddress,
    data: generateTransferCallData(to, amount),
    value: '0'
  }

  const transactionResponse = await signer.sendTransaction(transferEC20)

  return await transactionResponse.wait()
}
