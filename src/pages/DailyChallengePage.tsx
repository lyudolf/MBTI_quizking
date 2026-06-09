import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { CATEGORIES, Category, Question } from '../types';
import { calculateXP } from '../utils/xpCalculator';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function getTodaySeed(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const DAILY_QUESTION_COUNT = 5;
const CATEGORIES_LIST: Category[] = ['general', 'science', 'history', 'culture', 'economy', 'life', 'tech', 'art'];

export default function DailyChallengePage() {
  const navigate = useNavigate();
  const store = useGameStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [xpResult, setXpResult] = useState<{ base: number; timeBonus: number; perfectBonus: number; total: number } | null>(null);

  // Load daily questions
  useEffect(() => {
    if (store.dailyChallengeCompleted) {
      setLoading(false);
      return;
    }

    const loadQuestions = async () => {
      const seed = getTodaySeed();
      const rng = seededRandom(seed);
      const allQuestions: Question[] = [];

      for (const category of CATEGORIES_LIST) {
        try {
          const mod = await import(`../data/questions/${category}.json`);
          const categoryQuestions: Question[] = mod.default;
          allQuestions.push(...categoryQuestions);
        } catch {
          console.warn(`Failed to load ${category} questions`);
        }
      }

      if (allQuestions.length === 0) {
        setLoading(false);
        return;
      }

      // Shuffle with seed and pick 5
      const shuffled = [...allQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setQuestions(shuffled.slice(0, DAILY_QUESTION_COUNT));
      setQuestionStartTime(Date.now());
      setLoading(false);
    };

    loadQuestions();
  }, [store.dailyChallengeCompleted]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const question = questions[currentIndex];
    const isCorrect = answerIndex === question.answer;
    const elapsed = (Date.now() - questionStartTime) / 1000;

    setTimePerQuestion(prev => [...prev, elapsed]);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    store.recordAnswer(question.id, question.category as Category, isCorrect);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setQuestionStartTime(Date.now());
      } else {
        // Complete
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const finalTimes = [...timePerQuestion, elapsed];
        const xp = calculateXP(finalCorrect, finalTimes, DAILY_QUESTION_COUNT);

        // Daily challenge bonus
        const dailyBonus = finalCorrect === DAILY_QUESTION_COUNT ? 100 : 0;
        const totalXP = xp.total + dailyBonus;

        store.addXP(totalXP);
        store.completeDailyChallenge();

        setXpResult({
          base: xp.base,
          timeBonus: xp.timeBonus,
          perfectBonus: xp.perfectBonus + dailyBonus,
          total: totalXP,
        });
        setIsComplete(true);
      }
    }, 1500);
  }, [selectedAnswer, questions, currentIndex, questionStartTime, correctCount, timePerQuestion, store]);

  // Already completed state
  if (!loading && store.dailyChallengeCompleted && !isComplete) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/home')}>←</button>
          <h1>오늘의 챌린지</h1>
        </div>
        <div className="empty-state">
          <div className="emoji">✅</div>
          <div className="title">오늘의 챌린지 완료!</div>
          <div className="desc">내일 새로운 챌린지가 기다리고 있어요.<br/>매일 도전해서 연속 출석을 이어가세요!</div>
        </div>
        <button className="btn btn-primary btn-xl" onClick={() => navigate('/home')}>
          홈으로
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', paddingTop: '120px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ fontSize: '17px', fontWeight: 600 }}>챌린지 준비 중...</div>
        </div>
      </div>
    );
  }

  // Result screen
  if (isComplete && xpResult) {
    const isPerfect = correctCount === DAILY_QUESTION_COUNT;
    return (
      <div className="page">
        <div className="result-score">
          <div className="emoji">{isPerfect ? '🏆' : correctCount >= 3 ? '🎉' : '💪'}</div>
          <div className="score">
            <span className="highlight">{correctCount}</span>/{DAILY_QUESTION_COUNT}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>
            {isPerfect ? '퍼펙트! 대단해요!' : correctCount >= 3 ? '잘했어요!' : '다음엔 더 잘할 수 있어요!'}
          </p>
        </div>

        <div className="section-card">
          <div className="section-card-title" style={{ marginBottom: '12px' }}>📊 XP 획득</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>기본 XP ({correctCount}문제 정답)</span>
              <span style={{ fontWeight: 600 }}>+{xpResult.base}</span>
            </div>
            {xpResult.timeBonus > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-primary)' }}>
                <span>⚡ 빠른 정답 보너스</span>
                <span style={{ fontWeight: 600 }}>+{xpResult.timeBonus}</span>
              </div>
            )}
            {xpResult.perfectBonus > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-warning)' }}>
                <span>🏆 {isPerfect ? '퍼펙트 + 챌린지' : '챌린지'} 보너스</span>
                <span style={{ fontWeight: 600 }}>+{xpResult.perfectBonus}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
              <span>총 획득</span>
              <span className="xp-amount">+{xpResult.total} XP</span>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-xl" style={{ marginTop: '16px' }} onClick={() => navigate('/home')}>
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // Quiz mode
  if (questions.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="emoji">😅</div>
          <div className="title">문제를 불러올 수 없어요</div>
          <div className="desc">퀴즈 데이터를 확인해주세요.</div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const catInfo = CATEGORIES[question.category as Category];

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h1>오늘의 챌린지</h1>
        <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
          🎯 {currentIndex + 1}/{DAILY_QUESTION_COUNT}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: '24px' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / DAILY_QUESTION_COUNT) * 100}%` }}
        />
      </div>

      <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        {catInfo.icon} {catInfo.name}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.5, marginBottom: '24px' }}>
        {question.question}
      </h2>

      <div>
        {question.options.map((option, idx) => {
          let className = 'quiz-option';
          if (selectedAnswer !== null) {
            if (idx === question.answer) className += ' correct';
            else if (idx === selectedAnswer) className += ' wrong';
            else className += ' disabled';
          }
          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleAnswer(idx)}
              disabled={selectedAnswer !== null}
            >
              <span className="option-number">{idx + 1}</span>
              {option}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <div className="explanation-box" style={{ animation: 'slideUp 0.3s ease' }}>
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}
