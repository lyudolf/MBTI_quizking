/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AD_GROUP_ID_TICKET?: string;
  readonly VITE_AD_GROUP_ID_XP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
