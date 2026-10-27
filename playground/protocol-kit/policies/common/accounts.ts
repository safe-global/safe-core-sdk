// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * Accounts the policy scripts use. Keys and addresses come from the environment (see
 * `common/config.ts`); none is hard-coded.
 */

import type { Address } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import { envAccount, requireAccount, requireEnvAddress } from './config.ts';

/** The signer: owner of the test Safes, and the account that signs in to the gateway. */
export function signerAccount(): PrivateKeyAccount {
  return requireAccount('PRIVATE_KEY', 'the signer key');
}

/**
 * The proposer delegate, or `undefined` when unset. A delegate may propose but not sign, so its
 * proposals carry no confirmation: the way to queue an "in signing" transaction on a threshold-1 Safe.
 */
export function proposerAccount(): PrivateKeyAccount | undefined {
  return envAccount('PROPOSER_PRIVATE_KEY', 'the proposer delegate key');
}

/** Second owner of the test Safes, and where their funds are returned to. */
export function coOwner(): Address {
  return requireEnvAddress('CO_OWNER', 'second owner of the test Safes');
}

/** A trusted address: a single-use grantee, and a proposer that owns no test Safe. */
export function trustedAddress(): Address {
  return requireEnvAddress('TRUSTED_ADDRESS', 'single-use grantee of the test allowlists');
}
