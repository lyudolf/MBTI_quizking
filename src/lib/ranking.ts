import { supabase } from './supabase';

const TABLE = 'quizking_rankings';

export interface RankingRow {
  user_id: string;
  nickname: string;
  mbti: string;
  xp: number;
  equipped_title: string | null;
}

/** 랭킹 서버(Supabase) 연결 여부 */
export function isRankingEnabled(): boolean {
  return supabase !== null;
}

/**
 * 내 점수를 랭킹 테이블에 반영 (user_id 기준 upsert).
 * 실패해도 앱 흐름을 막지 않도록 조용히 무시.
 */
export async function syncMyRanking(row: RankingRow): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: row.user_id,
      nickname: row.nickname,
      mbti: row.mbti,
      xp: row.xp,
      equipped_title: row.equipped_title,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[ranking] sync 실패:', error.message);
  }
}

/**
 * 상위 랭킹 조회 (XP 내림차순).
 * @param limit 최대 인원
 * @param mbti  특정 MBTI만 필터링 (없으면 통합)
 */
export async function fetchTopRanking(
  limit = 100,
  mbti?: string
): Promise<RankingRow[]> {
  if (!supabase) return [];
  let query = supabase
    .from(TABLE)
    .select('user_id, nickname, mbti, xp, equipped_title')
    .order('xp', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (mbti) query = query.eq('mbti', mbti);

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[ranking] 조회 실패:', error.message);
    return [];
  }
  return (data as RankingRow[]) ?? [];
}

/**
 * 내 정확한 순위 = (나보다 XP 높은 유저 수) + 1.
 * 상위 N명 밖이어도 정확한 순위를 얻기 위해 count 쿼리 사용.
 */
export async function fetchMyRank(myXp: number, mbti?: string): Promise<number> {
  if (!supabase) return 0;
  let query = supabase
    .from(TABLE)
    .select('user_id', { count: 'exact', head: true })
    .gt('xp', myXp);

  if (mbti) query = query.eq('mbti', mbti);

  const { count, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[ranking] 순위 조회 실패:', error.message);
    return 0;
  }
  return (count ?? 0) + 1;
}
