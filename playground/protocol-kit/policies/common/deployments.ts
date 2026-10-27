// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * Contract deployments of the policy engine and of Safe v1.5.0.
 */

import { type Address, isAddressEqual } from 'viem';

export const SEPOLIA_CHAIN_ID = 11155111;

/** Safe v1.5.0 canonical deployments (same address on every supported chain). */
export const SAFE_V150 = {
  singletonL2: '0xEdd160fEBBD92E350D4D398fb636302fccd67C7e',
  proxyFactory: '0x14F2982D601c9458F93bd70B218933A6f8165e7b',
  fallbackHandler: '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4',
  multiSendCallOnly: '0xA83c336B20401Af773B6219BA5027174338D1836',
  multiSend: '0x218543288004CD07832472D464648173c77D7eB7',
} as const satisfies Record<string, Address>;

// ─── SafePolicyGuard ──────────────────────────────────────────────────────────────────────────────

/**
 * SafePolicyGuard deployments the policy indexer watches, by configuration DELAY in seconds. They
 * differ only in that delay; each root expires 7 days after it becomes ready.
 */
export const INDEXED_GUARDS: Readonly<Record<number, Address>> = {
  0: '0x55c241591E12CE3c58491D02b737F12D3199ae95',
  60: '0xC83bC185770ac0Da8A970f35695064eEe62e236c',
  600: '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57',
  3600: '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20',
  86400: '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED',
};

/** The same contract, no longer watched by the indexer, so CGW ignores it. */
export const LEGACY_GUARDS: Readonly<Record<number, Address>> = {
  5: '0x5202B1ebE100812437d47eae769e155945fbba6a',
};

export type GuardDeployment = { address: Address; delaySeconds: number; indexed: boolean };

/** Every known SafePolicyGuard, indexed ones first, each in order of its delay. */
export const GUARD_DEPLOYMENTS: ReadonlyArray<GuardDeployment> = [
  ...Object.entries(INDEXED_GUARDS).map(([delay, address]) => ({ address, delaySeconds: Number(delay), indexed: true })),
  ...Object.entries(LEGACY_GUARDS).map(([delay, address]) => ({ address, delaySeconds: Number(delay), indexed: false })),
];

/** The deployment {@link guard} is, or `undefined` for a contract that is not a known guard. */
export function findGuardDeployment(guard: Address): GuardDeployment | undefined {
  return GUARD_DEPLOYMENTS.find((deployment) => isAddressEqual(deployment.address, guard));
}

/** e.g. `SafePolicyGuard 60s`, `SafePolicyGuard 5s (legacy, not indexed)`, `unknown guard`. */
export function guardName(guard: Address): string {
  const deployment = findGuardDeployment(guard);
  if (!deployment) {
    return 'unknown guard';
  }
  return `SafePolicyGuard ${deployment.delaySeconds}s${deployment.indexed ? '' : ' (legacy, not indexed)'}`;
}

// ─── Policy contracts ─────────────────────────────────────────────────────────────────────────────

/** Policy contracts, as registered with the policy indexer. */
export const POLICY_CONTRACTS = {
  allow: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
  deny: '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436',
  allowedModule: '0x4736245188E315cB18b5DC2A9D7f92893D6e8CD7',
  cosigner: '0x65Bc0DADF4173C6d7125300cad9360339B3Ee478',
  erc20Approve: '0xfF86DD4caf79672E55e0C3e3A5410746600d60F4',
  erc20Transfer: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  multiSend: '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c',
  nativeTransfer: '0x2868C263EBF3672211E4C32e0B21689FF0584ca3',
} as const satisfies Record<string, Address>;

/** Superseded policy deployments: the indexer no longer recognises them, so neither does CGW. */
export const LEGACY_POLICY_CONTRACTS = {
  cosigner: '0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB',
  nativeTransfer: '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246',
} as const satisfies Record<string, Address>;

const POLICY_CONTRACT_NAMES: Record<keyof typeof POLICY_CONTRACTS, string> = {
  allow: 'AllowPolicy',
  deny: 'DenyPolicy',
  allowedModule: 'AllowedModulePolicy',
  cosigner: 'CoSignerPolicy',
  erc20Approve: 'ERC20ApprovePolicy',
  erc20Transfer: 'ERC20TransferPolicy',
  multiSend: 'MultiSendPolicy',
  nativeTransfer: 'NativeTransferPolicy',
};

/** The contract name of a known policy, e.g. `AllowPolicy` or `CoSignerPolicy (legacy, not indexed)`. */
export function policyContractName(policy: Address): string | undefined {
  const current = (Object.keys(POLICY_CONTRACTS) as Array<keyof typeof POLICY_CONTRACTS>).find((name) =>
    isAddressEqual(POLICY_CONTRACTS[name], policy),
  );
  if (current) {
    return POLICY_CONTRACT_NAMES[current];
  }
  const legacy = (Object.keys(LEGACY_POLICY_CONTRACTS) as Array<keyof typeof LEGACY_POLICY_CONTRACTS>).find((name) =>
    isAddressEqual(LEGACY_POLICY_CONTRACTS[name], policy),
  );
  return legacy ? `${POLICY_CONTRACT_NAMES[legacy]} (legacy, not indexed)` : undefined;
}
