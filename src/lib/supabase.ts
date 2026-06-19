import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase 클라이언트.
 * 환경변수가 없으면 null → 랭킹 기능이 자동으로 비활성화되고 앱은 정상 동작.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

if (!supabase) {
  // eslint-disable-next-line no-console
  console.warn(
    '[ranking] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없어 랭킹이 비활성화됩니다. .env 를 확인하세요.'
  );
}
