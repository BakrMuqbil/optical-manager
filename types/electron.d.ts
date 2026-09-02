export {};

declare global {
  interface Window {
    electronAPI: {
      platform: NodeJS.Platform;
      isElectron: boolean;
    };
  }
}