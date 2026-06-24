-- =============================================================
-- 유형별 봇 랭커 배치 (신규 유저 경쟁 구간에 밀집)
--  - 16유형 × 8명 = 128봇, XP 사다리(120~8000)로 항상 "바로 위 추월 대상" 형성
--  - 실유저가 쌓이면 삭제: delete from public.quizking_rankings where user_id like 'seed%';
--  - 재실행 안전 (기존 seed 삭제 후 재삽입)
-- =============================================================

delete from public.quizking_rankings where user_id like 'seed%';

insert into public.quizking_rankings (user_id, nickname, mbti, xp, equipped_title)
select
  'seed_' || t.mbti || '_' || g.i as user_id,
  (array['퀴즈러','상식왕','두뇌풀가동','지식인','호기심대장','잡학러',
         '퀴즈장인','데일리러','오늘도퀴즈','상식충전중','문제풀이왕','꾸준퀴즈'])
    [1 + floor(random() * 12)::int]
    || lpad((floor(random() * 99) + 1)::text, 2, '0') as nickname,
  t.mbti,
  (array[150, 400, 750, 1300, 2100, 3500, 6000, 9500])[g.i] + floor(random() * 200)::int as xp,
  null as equipped_title
from
  (select unnest(array[
     'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
     'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'
   ]) as mbti) t
  cross join generate_series(1, 8) as g(i);
