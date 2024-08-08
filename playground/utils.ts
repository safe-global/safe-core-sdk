import { Address, createPublicClient, custom, encodeFunctionData, parseAbi } from 'viem'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { ExternalSigner } from '@safe-global/protocol-kit'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = parseAbi(['function transfer(address _to, uint256 _value) returns (bool)'])

  return encodeFunctionData({
    abi: functionAbi,
    functionName: 'transfer',
    args: [to, value]
  })
}

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

export async function transfer(
  signer: ExternalSigner,
  tokenAddress: Address,
  to: Address,
  amount: bigint
) {
  const transferEC20 = {
    to: tokenAddress,
    data: generateTransferCallData(to, amount),
    value: 0n,
    chain: signer.chain
  }

  const hash = await signer.sendTransaction(transferEC20)

  const publicClient = createPublicClient({
    chain: signer.chain,
    transport: custom(signer.transport)
  })

  return await publicClient.waitForTransactionReceipt({ hash })
}
