import { ParticleNetwork, WalletEntryPosition } from "@particle-network/auth";
import { ParticleProvider } from "@particle-network/provider";
import { AuthKitSignInData } from '@safe-global/auth-kit/types';
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack';
import { ParticleConfig, ParticleEvent, ParticleEventListener } from './types';

/**
 * Implements the SafeAuthClient interface for adapting the Particle service provider.
 * 
 */
export class ParticleModalPack extends AuthKitBasePack {
  #provider: ParticleProvider | null = null;
  #txServiceUrl: string;
  particle?: ParticleNetwork;

  /**
   * Instantiate the ParticleModalPack with txServiceUrl.
   * @param options - Contains the txServiceUrl
   */
  constructor(options: { txServiceUrl: string }) {
    super();
    this.#txServiceUrl = options.txServiceUrl;
  }

  /**
   * Initialize the Particle service provider using the larger config.
   * @param config - The larger configuration for initializing Particle
   * @throws Error when initialization fails
   */
  async init(config: ParticleConfig) {
    config.txServiceUrl = this.#txServiceUrl;
    this.particle = new ParticleNetwork(config);
    this.#provider = new ParticleProvider(this.particle.auth);
  }

  /**
   * Connect to the Particle service provider and get sign-in data.
   * @returns The sign-in data from the provider
   * @throws Error when not initialized
   */
  async signIn(): Promise<AuthKitSignInData> {
    if (!this.particle) throw new Error('ParticleModalPack is not initialized');

    await this.particle.auth.login();
    const eoa = await this.particle.evm.getAddress() || '';
    const safes = await this.getSafes(this.#txServiceUrl);

    return { eoa, safes };
  }

  /**
   * Returns the ParticleProvider instance.
   * @returns The ParticleProvider instance or null
   */
  getProvider(): ParticleProvider | null {
    return this.#provider;
  }

  /**
   * Disconnect from the Particle service provider.
   * @throws Error when not initialized
   */
  async signOut() {
    if (!this.particle) throw new Error('ParticleModalPack is not initialized');

    this.particle.auth.logout();
  }

  /**
   * Get authenticated user information.
   * @returns The user info
   * @throws Error when not initialized
   */
  async getUserInfo(): Promise<any> {
    if (!this.particle) throw new Error('ParticleModalPack is not initialized');

    return this.particle.auth.getUserInfo();
  }

  /**
   * Subscribe to Particle events.
   * @param event - The event to subscribe to
   * @param handler - The event handler
   */
  subscribe(event: ParticleEvent, handler: ParticleEventListener) {
    this.particle?.auth.on(event, handler);
  }

  /** 
  * Blank placeholder function for unsubscribe; not relevant
  */
  unsubscribe() {}
}
