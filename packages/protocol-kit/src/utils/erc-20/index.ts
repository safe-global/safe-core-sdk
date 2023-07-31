import { Interface } from '@ethersproject/abi'

const ERC20_ABI = ['function transfer(address recipient, uint256 amount) returns (bool)']

export function encodeTransferERC20Token(tokenAddress: string, amount: string): string {
  const erc20Interface = new Interface(ERC20_ABI)

  return erc20Interface.encodeFunctionData('transfer', [tokenAddress, amount])
}
