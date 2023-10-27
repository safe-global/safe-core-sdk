export type ParticleEvent = 'connect' | 'disconnect' | 'chainChanged';
export type ParticleEventListener = (...args: any[]) => void;

export type ParticleWalletConfig = {
  displayWalletEntry?: boolean;
  uiMode?: 'light' | 'dark';
  supportChains?: Array<{ id: number; name: string }>;
  customStyle?: Record<string, unknown>;
};

export type ParticleSecurityAccountConfig = {
  promptSettingWhenSign?: number;
  promptMasterPasswordSettingWhenLogin?: number;
};

export type ParticleConfig = {
  projectId: string;
  clientKey: string;
  appId: string;
  chainName?: string;
  chainId?: number;
  wallet?: ParticleWalletConfig;
  securityAccount?: ParticleSecurityAccountConfig;
};
