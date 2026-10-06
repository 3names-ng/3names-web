export enum ExecutionEnvironment {
  Bare = "bare",
  StoreClient = "storeClient",
  Standalone = "standalone",
  HostEmbedded = "hostEmbedded",
}

export const Constants = {
  executionEnvironment: ExecutionEnvironment.Bare,
  appOwnership: null as string | null,
  sessionId: "",
  platform: { web: { design: 0 } as any },
  manifest: {} as any,
  manifest2: {} as any,
  expoConfig: null as any,
  expoGoVersion: "",
  nativeAppVersion: null as string | null,
  nativeBuildVersion: null as string | null,
  deviceName: undefined as string | undefined,
  deviceId: undefined as string | undefined,
  get: (key: string) => (undefined as any),
  id: "web",
};

export default Constants;
