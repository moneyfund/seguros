/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACOS_STAFF_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
