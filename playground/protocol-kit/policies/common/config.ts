// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * Settings that differ per environment: signer keys, endpoints, test accounts, test Safes. They are
 * read from the process environment only; nothing environment-specific or secret is hard-coded.
 *
 * Every variable is documented in `playground/protocol-kit/.example.env`. Copy it to `.env` next to
 * it, fill it in, and pass it to Node, which loads it natively:
 *
 *   node --env-file-if-exists=playground/protocol-kit/.env playground/protocol-kit/policies/<script>.ts …
 *
 * Variables already set in the environment take precedence over the file, so CI and secret
 * managers can provide them directly.
 */

import { type Address, getAddress, type Hex, isAddress } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';

const EXAMPLE_ENV = 'playground/protocol-kit/.example.env';

/** A missing or malformed setting. */
export class ConfigError extends Error {}

/** The trimmed value of {@link name}, or `undefined` when it is unset or blank. */
export function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function requireEnv(name: string, purpose?: string): string {
  const value = envString(name);
  if (value === undefined) {
    throw new ConfigError(`${name} is not set${purpose ? ` (${purpose})` : ''}: see ${EXAMPLE_ENV}`);
  }
  return value;
}

function toAddress(name: string, value: string): Address {
  if (!isAddress(value, { strict: false })) {
    throw new ConfigError(`${name}: "${value}" is not an address`);
  }
  return getAddress(value);
}

export function envAddress(name: string): Address | undefined {
  const value = envString(name);
  return value === undefined ? undefined : toAddress(name, value);
}

export function requireEnvAddress(name: string, purpose?: string): Address {
  return toAddress(name, requireEnv(name, purpose));
}

/**
 * A comma-separated list of `address` or `address:label` entries, e.g. the known test Safes. An
 * unset variable is an empty list.
 */
export function envAddressList(name: string): Array<{ address: Address; label: string }> {
  return (envString(name) ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .map((entry) => {
      const separator = entry.indexOf(':');
      const address = separator === -1 ? entry : entry.slice(0, separator);
      const label = separator === -1 ? '' : entry.slice(separator + 1).trim();
      return { address: toAddress(name, address.trim()), label };
    });
}

/** The account of the private key in {@link name}; keys are never accepted as CLI arguments. */
export function requireAccount(name = 'PRIVATE_KEY', purpose = 'the signer key'): PrivateKeyAccount {
  const key = requireEnv(name, purpose);
  const hex = (key.startsWith('0x') ? key : `0x${key}`) as Hex;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new ConfigError(`${name} must be a 32-byte hex private key`);
  }
  return privateKeyToAccount(hex);
}

/** The account of {@link name}, or `undefined` when it is unset. */
export function envAccount(name: string, purpose?: string): PrivateKeyAccount | undefined {
  return envString(name) === undefined ? undefined : requireAccount(name, purpose);
}

/** How help text shows a setting: its value when set, else `$NAME`. */
export function envHint(name: string): string {
  return envString(name) ?? `$${name}`;
}
