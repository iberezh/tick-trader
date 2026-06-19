/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRADING_URL?: string;
  readonly VITE_ANALYTICS_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
