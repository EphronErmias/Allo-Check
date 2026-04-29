/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Public site origin for share links (e.g. https://allocheck.example). Defaults to window.location.origin. */
  readonly VITE_APP_ORIGIN?: string;
  readonly VITE_PARTNERS_BANNER_URL?: string;
  /** Where “Buy original phones from Allo” opens (full URL). */
  readonly VITE_ALLO_SHOP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
