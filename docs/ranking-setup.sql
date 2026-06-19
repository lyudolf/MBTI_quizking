-- =============================================================
-- MBTI 퀴즈왕 · 랭킹 테이블 설정
-- 기존에 쓰던 Supabase 프로젝트의 SQL Editor 에 그대로 붙여넣어 실행하세요.
-- =============================================================

-- 1) 테이블 ------------------------------------------------------
create table if not exists public.quizking_rankings (
  user_id        text primary key,
  nickname       text        not null,
  mbti           text        not null,
  xp             integer     not null default 0,
  equipped_title text,
  updated_at     timestamptz not null default now()
);

-- 2) 인덱스 (정렬/필터 성능) ------------------------------------
create index if not exists idx_quizking_rankings_xp
  on public.quizking_rankings (xp desc);
create index if not exists idx_quizking_rankings_mbti_xp
  on public.quizking_rankings (mbti, xp desc);

-- 3) RLS 정책 ---------------------------------------------------
-- MVP: anon 키로 읽기/쓰기 허용.
--  ⚠️ XP가 클라이언트(localStorage)에서 계산·전송되므로 점수 위조가 가능합니다.
--     경쟁 랭킹을 본격 운영할 때는 Toss 인증 + 서버측 검증(Edge Function/RPC)으로
--     아래 정책을 "본인 행만 수정" 으로 좁히세요.
alter table public.quizking_rankings enable row level security;

drop policy if exists "quizking read all"   on public.quizking_rankings;
drop policy if exists "quizking insert any" on public.quizking_rankings;
drop policy if exists "quizking update any" on public.quizking_rankings;

create policy "quizking read all"
  on public.quizking_rankings for select
  using (true);

create policy "quizking insert any"
  on public.quizking_rankings for insert
  with check (true);

create policy "quizking update any"
  on public.quizking_rankings for update
  using (true) with check (true);

-- =============================================================
-- 4) (선택) 시드 데이터 — 출시 초기 랭킹이 비어 보이지 않도록
--    기존 시뮬레이션 유저 30명을 넣습니다. 실유저가 쌓이면 지워도 됩니다.
--    삭제: delete from public.quizking_rankings where user_id like 'seed_%';
-- =============================================================
insert into public.quizking_rankings (user_id, nickname, mbti, xp, equipped_title) values
  ('seed_01', '퀴즈천재김씨', 'ENTJ', 52300, '워렌버핏의 후계자'),
  ('seed_02', '상식왕이다',   'INTJ', 48100, '아인슈타인의 후예'),
  ('seed_03', '문과의자존심', 'INFJ', 41200, '시간여행자'),
  ('seed_04', '호기심대마왕', 'ENTP', 37800, '실리콘밸리 인재'),
  ('seed_05', '돌고래뇌섹',   'INTP', 34500, null),
  ('seed_06', '지식흡수왕',   'ESTJ', 29800, null),
  ('seed_07', '달빛지식인',   'INFP', 25400, '르네상스 영혼'),
  ('seed_08', '새벽공부왕',   'ISTJ', 21000, null),
  ('seed_09', '두뇌풀가동',   'INTJ', 19500, null),
  ('seed_10', '퀴즈러버88',   'ENFP', 17600, null),
  ('seed_11', '문화통달자',   'ENFJ', 16400, null),
  ('seed_12', '경제박사꿈',   'ESTJ', 15300, null),
  ('seed_13', '브레인스톰',   'ENTJ', 14200, null),
  ('seed_14', '역사매니아',   'ISTJ', 13700, null),
  ('seed_15', '지식탐험가',   'ENTP', 12800, null),
  ('seed_16', '상식덕후',     'ISFJ', 11500, null),
  ('seed_17', '생활백서',     'ESFJ', 10200, null),
  ('seed_18', '알쓸신잡팬',   'ENFJ', 9200,  null),
  ('seed_19', '분석의달인',   'INTP', 8900,  null),
  ('seed_20', '과학소년',     'ISTP', 7800,  null),
  ('seed_21', '궁금한고양이', 'ESFJ', 7100,  null),
  ('seed_22', '호기심냥이',   'ENFP', 6800,  null),
  ('seed_23', '논리왕자',     'ENTJ', 6300,  null),
  ('seed_24', '잡학다식맨',   'ISTP', 5400,  null),
  ('seed_25', '예술의혼',     'ISFP', 4800,  null),
  ('seed_26', '사색가',       'INFP', 4200,  null),
  ('seed_27', '도전정신왕',   'ESTP', 3800,  null),
  ('seed_28', '초보퀴즈러',   'ISFP', 2100,  null),
  ('seed_29', '첫도전중',     'ESFP', 800,   null),
  ('seed_30', '방금시작',     'ISFP', 200,   null)
on conflict (user_id) do nothing;
