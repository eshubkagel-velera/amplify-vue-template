declare global {
  interface Window {
    currentEnvironment: string;
    environments: Record<string, any>;
    switchEnvironment: (envKey: string) => void;
  }
}

export {};