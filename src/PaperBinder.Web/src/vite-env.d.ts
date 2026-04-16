/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAPERBINDER_ROOT_URL: string;
  readonly VITE_PAPERBINDER_API_BASE_URL: string;
  readonly VITE_PAPERBINDER_TENANT_BASE_DOMAIN: string;
  readonly VITE_PAPERBINDER_CHALLENGE_SITE_KEY: string;
  readonly VITE_PAPERBINDER_CHALLENGE_SCRIPT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
