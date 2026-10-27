// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * Test Safes the policy scripts act on by default, read from the environment (see
 * `common/config.ts`). Each list is `address[:label]`, comma-separated.
 */

import type { Address } from 'viem';
import { envAddressList, requireEnvAddress } from './config.ts';

/** The Safe that carries one of every guard policy kind (built by `showcase-safe.ts`). */
export function policyShowcaseSafe(): Address {
  return requireEnvAddress('POLICY_SHOWCASE_SAFE', 'the policy showcase Safe');
}

/** Safes `cgw-space-policies.ts` adds to a Space: `KNOWN_POLICY_SAFES`. */
export function knownPolicySafes(): Array<{ address: Address; label: string }> {
  return envAddressList('KNOWN_POLICY_SAFES');
}

/** Safes with guard policies that `cgw-pending-policies.ts` acts on: `POLICY_TEST_SAFES`. */
export function policyTestSafes(): Array<{ address: Address; label: string }> {
  return envAddressList('POLICY_TEST_SAFES');
}
