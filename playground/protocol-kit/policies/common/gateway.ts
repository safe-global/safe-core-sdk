// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * A small client for the Safe Client Gateway (CGW): SIWE sign-in, Spaces, their Safes and the
 * policy configuration requests.
 */

import { type Address, type Hex, isAddressEqual } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import { createSiweMessage } from 'viem/siwe';
import { requireEnv } from './config.ts';
import { type Configuration, configurationRoot } from './policies.ts';

/** The gateway the scripts use by default: `CGW_URL`, e.g. a local CGW. */
export function defaultGatewayUrl(): string {
  return requireEnv('CGW_URL', 'the Safe Client Gateway URL');
}

/** The staging gateway, for `--staging` / `--gateway staging`: `CGW_STAGING_URL`. */
export function stagingGatewayUrl(): string {
  return requireEnv('CGW_STAGING_URL', 'the staging Safe Client Gateway URL');
}

export type Space = { uuid: string; name: string };

/** A Safe on a chain, as the Spaces API takes it. */
export type ChainSafe = { chainId: string; address: Address };

/** The Safes of a Space, by chain id. */
export type SpaceSafes = Record<string, Array<Address>>;

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** The `access_token` cookie value, from {@link GatewayClient.signIn}. */
  token?: string;
  /** Statuses besides 2xx that the caller handles itself. */
  acceptedStatuses?: ReadonlyArray<number>;
};

export type GatewayClient = ReturnType<typeof createGatewayClient>;

export function createGatewayClient(baseUrl: string) {
  const url = baseUrl.replace(/\/$/, '');

  /** A CGW request that throws with the response body on an unexpected status. */
  async function request(path: string, options: RequestOptions = {}): Promise<Response> {
    const method = options.method ?? 'GET';
    const response = await fetch(`${url}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { cookie: `access_token=${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (!response.ok && !options.acceptedStatuses?.includes(response.status)) {
      throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
    }
    return response;
  }

  async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return (await (await request(path, options)).json()) as T;
  }

  /**
   * Sign-In with Ethereum; returns the `access_token` cookie value. The message is bound to the
   * gateway's host, or to {@link args.siweDomain} for a gateway whose allow list lacks its own.
   */
  async function signIn(signer: PrivateKeyAccount, args: { chainId: number; siweDomain?: string }): Promise<string> {
    const { nonce } = await requestJson<{ nonce: string }>('/v1/auth/nonce');
    const domainUrl = new URL(args.siweDomain ? `https://${args.siweDomain}` : url);
    const message = createSiweMessage({
      address: signer.address,
      chainId: args.chainId,
      domain: domainUrl.host,
      uri: domainUrl.origin,
      nonce,
      version: '1',
      issuedAt: new Date(),
    });
    const signature = await signer.signMessage({ message });
    const response = await request('/v1/auth/verify', { method: 'POST', body: { message, signature } });
    const token = /access_token=([^;]+)/.exec(response.headers.get('set-cookie') ?? '')?.[1];
    if (!token) {
      throw new Error('No access_token cookie in the /v1/auth/verify response');
    }
    return token;
  }

  /** Registers the signed-in wallet as a user; a no-op when it already is one. */
  async function registerUser(token: string): Promise<void> {
    await request('/v1/users/wallet', { method: 'POST', token, acceptedStatuses: [409] });
  }

  function listSpaces(token: string): Promise<Array<Space>> {
    return requestJson('/v1/spaces', { token });
  }

  async function createSpace(token: string, name: string): Promise<string> {
    const { uuid } = await requestJson<{ uuid: string }>('/v1/spaces', { method: 'POST', token, body: { name } });
    return uuid;
  }

  async function listSpaceSafes(token: string, spaceId: string): Promise<SpaceSafes> {
    const { safes } = await requestJson<{ safes: SpaceSafes }>(`/v1/spaces/${spaceId}/safes`, { token });
    return safes;
  }

  async function addSafesToSpace(token: string, spaceId: string, safes: ReadonlyArray<ChainSafe>): Promise<void> {
    await request(`/v1/spaces/${spaceId}/safes`, { method: 'POST', token, body: { safes } });
  }

  /**
   * Free Safe seats in the Space, or `null` when it has no seat quota: the gateway does not enforce
   * entitlements (an older one has no entitlements API), or the plan's seats are unlimited.
   */
  async function freeSafeSeats(token: string, spaceId: string): Promise<number | null> {
    const response = await request(`/v1/spaces/${spaceId}/entitlements`, { token, acceptedStatuses: [404] });
    if (response.status === 404) {
      return null;
    }
    const { entitlements } = (await response.json()) as {
      entitlements: Array<{ feature: string; quota?: number | null; used?: number }>;
    };
    const seats = entitlements.find((entitlement) => entitlement.feature === 'safe_seats');
    if (seats?.quota === undefined || seats.quota === null) {
      return null;
    }
    return Math.max(seats.quota - (seats.used ?? 0), 0);
  }

  /** Stores the configurations behind their root, which makes the root a draft; returns the root. */
  async function storeConfigurationRequest(
    token: string,
    args: { spaceId: string; safe: ChainSafe; configurations: ReadonlyArray<Configuration> },
  ): Promise<Hex> {
    const path = `/v1/spaces/${args.spaceId}/chains/${args.safe.chainId}/safes/${args.safe.address}/policies/requests`;
    const stored = await requestJson<{ root: Hex }>(path, {
      method: 'POST',
      token,
      body: { root: configurationRoot(args.configurations), configurations: args.configurations },
    });
    return stored.root;
  }

  /** The Transaction Service the gateway reads the chain's Safes and queues from. */
  async function readTransactionServiceUrl(chainId: number): Promise<string> {
    const { transactionService } = await requestJson<{ transactionService: string }>(`/v1/chains/${chainId}`);
    return transactionService.replace(/\/$/, '');
  }

  return {
    url,
    request,
    signIn,
    registerUser,
    listSpaces,
    createSpace,
    listSpaceSafes,
    addSafesToSpace,
    freeSafeSeats,
    storeConfigurationRequest,
    readTransactionServiceUrl,
  };
}

/** Whether {@link held} lists {@link safe}. */
export function spaceHoldsSafe(held: SpaceSafes, safe: ChainSafe): boolean {
  return (held[safe.chainId] ?? []).some((address) => isAddressEqual(address, safe.address));
}
