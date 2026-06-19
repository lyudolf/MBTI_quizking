// 랭킹 DB 연결 검증 스크립트
//   사용법:  node scripts/test-ranking.mjs
//   .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 읽어
//   테이블 존재 / 읽기 / 쓰기(upsert) / 갱신 / 정리 까지 점검합니다.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- .env 파싱 (dotenv 없이 간단 파싱) ---
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env 없으면 process.env 만 사용
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없습니다.');
  process.exit(1);
}

const TABLE = 'quizking_rankings';
const supabase = createClient(url, key);
const TEST_ID = 'test_connection_check';

let failed = false;
const ok = (m) => console.log('✅ ' + m);
const ng = (m) => { console.error('❌ ' + m); failed = true; };

console.log(`\n🔌 연결: ${url}\n`);

// 1) 읽기 + 테이블 존재
{
  const { count, error } = await supabase
    .from(TABLE)
    .select('user_id', { count: 'exact', head: true });
  if (error) ng(`테이블 읽기 실패: ${error.message} (SQL 실행 / RLS 확인 필요)`);
  else ok(`테이블 읽기 OK — 현재 ${count ?? 0}행 (시드 30 + 실유저)`);
}

// 2) 상위 5명 조회
{
  const { data, error } = await supabase
    .from(TABLE)
    .select('nickname, mbti, xp')
    .order('xp', { ascending: false })
    .limit(5);
  if (error) ng(`정렬 조회 실패: ${error.message}`);
  else {
    ok('상위 5명:');
    data.forEach((r, i) => console.log(`   ${i + 1}. ${r.nickname} (${r.mbti}) ${r.xp} XP`));
  }
}

// 3) 쓰기(upsert)
{
  const { error } = await supabase.from(TABLE).upsert({
    user_id: TEST_ID, nickname: '연결테스트', mbti: 'INTJ', xp: 1,
    equipped_title: null, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) ng(`쓰기(insert) 실패: ${error.message} (RLS insert 정책 확인)`);
  else ok('쓰기(upsert) OK');
}

// 4) 갱신(update)
{
  const { error } = await supabase.from(TABLE)
    .update({ xp: 2 }).eq('user_id', TEST_ID);
  if (error) ng(`갱신(update) 실패: ${error.message} (RLS update 정책 확인)`);
  else ok('갱신(update) OK');
}

// 5) 내 순위 count 쿼리 검증
{
  const { count, error } = await supabase.from(TABLE)
    .select('user_id', { count: 'exact', head: true }).gt('xp', 2);
  if (error) ng(`순위 count 쿼리 실패: ${error.message}`);
  else ok(`순위 count 쿼리 OK — xp>2 인 유저 ${count ?? 0}명`);
}

// 6) 테스트 행 정리
{
  const { error } = await supabase.from(TABLE).delete().eq('user_id', TEST_ID);
  if (error) console.warn(`⚠️ 테스트 행 삭제 실패(무시 가능): ${error.message}`);
  else ok('테스트 행 정리 완료');
}

console.log(failed
  ? '\n❌ 일부 점검 실패 — 위 메시지를 확인하세요.\n'
  : '\n🎉 모든 점검 통과! 랭킹 연동 정상입니다.\n');
process.exit(failed ? 1 : 0);
