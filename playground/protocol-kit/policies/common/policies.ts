// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * SafePolicyGuard configurations and the policy types CGW reports.
 */

import { type Address, encodeAbiParameters, type Hex, keccak256 } from 'viem';
import type { Operation } from './safe.ts';

/** One `Configuration` of SafePolicyGuard: binds `policy` to an access (target, selector, operation). */
export type Configuration = {
  target: Address;
  selector: Hex;
  operation: Operation;
  /** The zero address removes the binding of this access. */
  policy: Address;
  /** The policy's payload, abi-encoded as the policy expects it. */
  data: Hex;
};

/** The selector of an access without calldata, such as a plain value transfer. */
export const NO_SELECTOR: Hex = '0x00000000';

/** `Permission` of the allowlist policies. */
export const PERMISSION = { none: 0, once: 1, always: 2 } as const;
export type PermissionName = keyof typeof PERMISSION;

export type AllowlistEntry = { address: Address; permission: PermissionName };

/** `abi.encode((address account, uint8 permission)[])`: the payload of the ERC-20 policies. */
export function encodeAllowlist(entries: ReadonlyArray<AllowlistEntry>): Hex {
  return encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          { name: 'account', type: 'address' },
          { name: 'permission', type: 'uint8' },
        ],
      },
    ],
    [entries.map(({ address, permission }) => ({ account: address, permission: PERMISSION[permission] }))],
  );
}

/** `keccak256(abi.encode(configurations))`: the root `requestConfiguration` takes. */
export function configurationRoot(configurations: ReadonlyArray<Configuration>): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        {
          type: 'tuple[]',
          components: [
            { name: 'target', type: 'address' },
            { name: 'selector', type: 'bytes4' },
            { name: 'operation', type: 'uint8' },
            { name: 'policy', type: 'address' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      [configurations],
    ),
  );
}

/** `AccessSelector.create`: target in the low 160 bits, selector in the top 4 bytes, operation at bit 216. */
export function packAccess({ target, selector, operation }: Pick<Configuration, 'target' | 'selector' | 'operation'>): bigint {
  return BigInt(target) | (BigInt(selector) << 224n) | (BigInt(operation) << 216n);
}

/** The policy types a SafePolicyGuard enforces, as the CGW policies API names them. */
export const GUARD_POLICY_TYPES = ['erc20-transfer', 'cosigner', 'allow', 'native-transfer', 'deny', 'multisend'] as const;

/** Every policy type the CGW policies API reports: the `types` filter of its reads. */
export const CGW_POLICY_TYPES = ['spending-limit', 'recovery', 'proposer', ...GUARD_POLICY_TYPES] as const;
