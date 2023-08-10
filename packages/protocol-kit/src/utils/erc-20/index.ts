import { Interface } from '@ethersproject/abi'
import Safe from '@safe-global/protocol-kit/Safe'
import { Transaction } from '@safe-global/safe-core-sdk-types'

import { ZERO_ADDRESS } from '../constants'

const ERC20_ABI = [
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
]

/**
 * Returns the number of decimals of a given ERC-20 token.
 *
 * @async
 * @param {string} tokenAddress - The address of the ERC-20 token.
 * @param {Safe} safe - The Safe object.
 * @returns {Promise<number>} The number of decimals that the token uses.
 * @throws "Invalid ERC-20 decimals"
 */
export async function getERC20Decimals(tokenAddress: string, safe: Safe): Promise<number> {
  const ethAdapter = safe.getEthAdapter()
  const erc20Interface = new Interface(ERC20_ABI)

  const getTokenDecimalsTransaction = {
    to: tokenAddress,
    from: tokenAddress,
    value: '0',
    data: erc20Interface.encodeFunctionData('decimals')
  }

  const response = await ethAdapter.call(getTokenDecimalsTransaction)

  const decimals = Number(response)

  if (Number.isNaN(decimals)) {
    throw new Error('Invalid ERC-20 decimals')
  }

  return decimals
}

const STANDARD_ERC20_DECIMALS = 18

/**
 * Checks if the given gas token is compatible with the handlePayment function present in the Safe smart contract.
 * A token is considered compatible if it is a native token or a standard ERC-20 token with 18 decimals.
 *
 * @async
 * @export
 * @param {string} gasToken - The address of the gas token.
 * @param {Safe} safe - The Safe object.
 * @returns {Promise<boolean>} Returns true if the gas token is compatible, otherwise false.
 */
export async function isGasTokenCompatibleWithHandlePayment(
  gasToken: string,
  safe: Safe
): Promise<boolean> {
  const isNativeToken = gasToken === ZERO_ADDRESS

  if (isNativeToken) {
    return true
  }

  // Only ERC20 tokens with the standard 18 decimals are compatible
  const gasTokenDecimals = await getERC20Decimals(gasToken, safe)
  const hasTokenStandardERC20Decimals = gasTokenDecimals === STANDARD_ERC20_DECIMALS

  return hasTokenStandardERC20Decimals
}

/**
 * Creates a transaction object to perform a transfer of a specified amount of ERC-20 tokens to a given address.
 *
 * @export
 * @param {string} tokenAddress - The address of the ERC-20 token.
 * @param {string} toAddress - The address to which the tokens should be transferred.
 * @param {string} amount - The amount of tokens to transfer.
 * @returns {Transaction} Returns a transaction object that represents the transfer.
 */
export function createERC20TokenTransferTransaction(
  tokenAddress: string,
  toAddress: string,
  amount: string
): Transaction {
  const erc20Interface = new Interface(ERC20_ABI)

  const transferTransaction = {
    to: tokenAddress,
    value: '0',
    data: erc20Interface.encodeFunctionData('transfer', [toAddress, amount])
  }

  return transferTransaction
}
