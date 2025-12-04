/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // adicione mais variáveis se quiser
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
