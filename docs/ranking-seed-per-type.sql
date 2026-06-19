-- =============================================================
-- 유형별 랭킹 시드 — 16개 MBTI 유형마다 6명씩 추가
-- (각 유형 포디움 3명 + 4위~ 리스트가 채워지도록)
-- Supabase SQL Editor 에 붙여넣어 1회 실행하세요. 재실행해도 중복 안 됨.
-- 실유저가 충분히 쌓이면 삭제: delete from public.quizking_rankings where user_id like 'seed2_%';
-- =============================================================
insert into public.quizking_rankings (user_id, nickname, mbti, xp, equipped_title)
select
  'seed2_' || t.mbti || '_' || g,
  (array['지식왕','퀴즈러버','상식부자','두뇌풀가동','똑똑박사','잡학마스터','정답요정','문제사냥꾼'])[1 + (g % 8)] || g,
  t.mbti,
  (2000 + floor(random() * 45000))::int,
  null
from (values
  ('INTJ'),('INTP'),('ENTJ'),('ENTP'),
  ('INFJ'),('INFP'),('ENFJ'),('ENFP'),
  ('ISTJ'),('ISFJ'),('ESTJ'),('ESFJ'),
  ('ISTP'),('ISFP'),('ESTP'),('ESFP')
) as t(mbti),
generate_series(1, 6) as g
on conflict (user_id) do nothing;
