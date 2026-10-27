// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * Safe transaction primitives: operations, storage slots, the EIP-712 SafeTx type, signatures and
 * MultiSend batches.
 */

import { type Address, concat, encodeFunctionData, encodePacked, type Hex, pad, size } from 'viem';
import { MULTISEND_ABI } from './abis.ts';

export const CALL = 0;
export const DELEGATECALL = 1;
export type Operation = typeof CALL | typeof DELEGATECALL;

/** Start and end of the Safe's linked lists of owners and modules. */
export const SENTINEL_ADDRESS: Address = '0x0000000000000000000000000000000000000001';

/** `GuardManager.GUARD_STORAGE_SLOT`: the transaction guard. */
export const TRANSACTION_GUARD_STORAGE_SLOT: Hex = '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8';

/** `ModuleManager.MODULE_GUARD_STORAGE_SLOT`: the module guard (Safe v1.5.0 and later). */
export const MODULE_GUARD_STORAGE_SLOT: Hex = '0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947';

export type MetaTransaction = { to: Address; value: bigint; data: Hex; operation: Operation };

/** The EIP-712 `SafeTx` type a Safe transaction hash is computed over. */
export const SAFE_TX_TYPES = {
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * An owner's pre-validated signature (`r` = owner, `s` = 0, `v` = 1): valid without signing,
 * because the owner itself submits the transaction.
 */
export function preValidatedSignature(owner: Address): Hex {
  return concat([pad(owner, { size: 32 }), pad('0x', { size: 32 }), '0x01']);
}

/** `multiSend(transactions)` calldata running {@link transactions} in order. */
export function encodeMultiSend(transactions: ReadonlyArray<MetaTransaction>): Hex {
  const packed = concat(
    transactions.map(({ operation, to, value, data }) =>
      encodePacked(['uint8', 'address', 'uint256', 'uint256', 'bytes'], [operation, to, value, BigInt(size(data)), data]),
    ),
  );
  return encodeFunctionData({ abi: MULTISEND_ABI, functionName: 'multiSend', args: [packed] });
}
