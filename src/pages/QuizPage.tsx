import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { CATEGORIES, Category, Question } from '../types';

const TIMER_SECONDS = 15;
const QUESTIONS_PER_QUIZ = 10;

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const refundTicket = useGameStore((s) => s.refundTicket);

  const params = new URLSearchParams(location.search);
  const category = params.get('category') as Category;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<{ questionId: string; correct: boolean; timeTaken: number }[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load questions
  useEffect(() => {
    if (!category || !CATEGORIES[category]) {
      navigate('/category', { replace: true });
      return;
    }

    const loadQuestions = async () => {
      try {
        const module = await import(`../data/questions/${category}.json`);
        const allQuestions: Question[] = module.default || module;
        // Shuffle and pick
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, QUESTIONS_PER_QUIZ));
        setLoading(false);
      } catch {
        setLoadError(true);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [category, navigate]);

  // Timer
  useEffect(() => {
    if (loading || answered || questions.length === 0) return;

    startTimeRef.current = Date.now();
    setTimeLeft(TIMER_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, answered, questions.length]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft <= 0 && !answered && questions.length > 0) {
      handleAnswer(-1); // timeout = wrong
    }
  }, [timeLeft, answered, questions.length]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (answered || questions.length === 0) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = questions[currentIndex];
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const correct = optionIndex === currentQuestion.answer;

    setSelectedAnswer(optionIndex);
    setAnswered(true);

    const newResult = { questionId: currentQuestion.id, correct, timeTaken };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    // Auto-advance after 1.5s
    advanceTimeoutRef.current = setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        // 퀴즈 완료 시 일괄 커밋 (나가기 시에는 호출되지 않음)
        updatedResults.forEach((r) => {
          recordAnswer(r.questionId, category, r.correct);
        });
        navigate('/result', {
          replace: true,
          state: {
            category,
            results: updatedResults,
            totalQuestions: questions.length,
          },
        });
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      }
    }, 1500);
  }, [answered, questions, currentIndex, category, results, recordAnswer, navigate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1s ease-in-out infinite alternate' }}>📝</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            문제를 준비하고 있어요...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="emoji">😢</div>
          <div className="title">문제를 불러올 수 없어요</div>
          <div className="desc">잠시 후 다시 시도해주세요</div>
          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: '24px' }}
            onClick={() => navigate('/category', { replace: true })}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const catInfo = CATEGORIES[category];
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerClass = timeLeft <= 3 ? 'danger' : timeLeft <= 5 ? 'warning' : '';

  return (
    <div className="page" style={{ padding: '0 24px 24px' }}>
      {/* Header with Exit */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0 0',
      }}>
        <button
          onClick={() => setShowExitModal(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-tertiary)',
            padding: '4px 8px',
          }}
        >
          ✕ 나가기
        </button>
        <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </div>
      {/* Timer Bar */}
      <div className="timer-bar">
        <div
          className={`timer-bar-fill ${timerClass}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Progress Dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '6px',
        padding: '16px 0 12px',
      }}>
        {questions.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? '20px' : '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: i < currentIndex
                ? (results[i]?.correct ? 'var(--color-success)' : 'var(--color-danger)')
                : i === currentIndex
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-tertiary)',
              transition: 'all var(--transition-fast)',
            }}
          />
        ))}
      </div>

      {/* Question Counter */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <span className="badge badge-primary">
          {catInfo.icon} {catInfo.name}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question */}
      <div style={{
        fontSize: '18px', fontWeight: 700, lineHeight: 1.6,
        marginBottom: '24px', minHeight: '80px',
        animation: 'slideUp var(--transition-normal)',
      }}>
        {currentQuestion.question}
      </div>

      {/* Options */}
      <div>
        {currentQuestion.options.map((option, i) => {
          let className = 'quiz-option';
          if (answered) {
            if (i === currentQuestion.answer) {
              className += ' correct';
            } else if (i === selectedAnswer && selectedAnswer !== currentQuestion.answer) {
              className += ' wrong';
            } else {
              className += ' disabled';
            }
          }

          return (
            <button
              key={i}
              className={className}
              onClick={() => handleAnswer(i)}
              disabled={answered}
            >
              <span className="option-number">{i + 1}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className="explanation-box" style={{ animation: 'slideUp var(--transition-normal)' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {selectedAnswer === currentQuestion.answer ? '✅ 정답!' : selectedAnswer === -1 ? '⏰ 시간 초과!' : '❌ 오답!'}
          </div>
          {currentQuestion.explanation}
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="modal-overlay" onClick={() => setShowExitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">⚠️</div>
            <div className="modal-title">정말 나가시겠어요?</div>
            <p className="modal-desc">
              나가면 여태까지 풀었던 문제들이 초기화됩니다.<br />
              티켓은 환불됩니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
                  refundTicket();
                  navigate('/category', { replace: true });
                }}
              >
                나가기
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setShowExitModal(false)}
              >
                계속 풀기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
