import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { useWrongNote } from '../hooks/useWrongNote';
import { CATEGORIES, Category, Question } from '../types';

export default function WrongNotePage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const { getAvailableNotes, getPendingNotes, getNotesGroupedByCategory } = useWrongNote();

  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCategory, setReviewCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number; xpEarned: number }>({ correct: 0, total: 0, xpEarned: 0 });

  const availableNotes = useMemo(() => getAvailableNotes(), [store.wrongNotes]);
  const pendingNotes = useMemo(() => getPendingNotes(), [store.wrongNotes]);
  const groupedNotes = useMemo(() => getNotesGroupedByCategory(), [store.wrongNotes]);

  const availableGrouped = useMemo(() => {
    const result: Record<string, typeof availableNotes> = {};
    for (const note of availableNotes) {
      if (!result[note.category]) result[note.category] = [];
      result[note.category].push(note);
    }
    return result;
  }, [availableNotes]);

  const startReview = useCallback(async (category: Category) => {
    const notes = availableNotes.filter(n => n.category === category);
    if (notes.length === 0) return;

    try {
      const mod = await import(`../data/questions/${category}.json`);
      const allQuestions: Question[] = mod.default;
      const noteIds = new Set(notes.map(n => n.questionId));
      const reviewQuestions = allQuestions.filter(q => noteIds.has(q.id));

      if (reviewQuestions.length === 0) return;

      setQuestions(reviewQuestions);
      setReviewCategory(category);
      setReviewMode(true);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setResults({ correct: 0, total: reviewQuestions.length });
    } catch {
      console.error('Failed to load questions for', category);
    }
  }, [availableNotes]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const question = questions[currentIndex];
    const isCorrect = answerIndex === question.answer;

    if (isCorrect) {
      store.removeWrongNote(question.id);
      store.recordAnswer(question.id, question.category as Category, true);
      store.addXP(5);
      setResults(prev => ({ ...prev, correct: prev.correct + 1, xpEarned: prev.xpEarned + 5 }));
    } else {
      store.updateWrongNoteDate(question.id);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  }, [selectedAnswer, questions, currentIndex, store]);

  // Review complete screen
  if (reviewMode && showResult) {
    return (
      <div className="page">
        <div className="result-score">
          <div className="emoji">{results.correct === results.total ? '🎉' : '📝'}</div>
          <div className="score">
            <span className="highlight">{results.correct}</span>/{results.total}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            {results.correct === results.total
              ? '모든 오답을 정복했어요!'
              : `${results.total - results.correct}개 문제가 다시 오답노트에 저장됐어요.`}
          </p>
          {results.xpEarned > 0 && (
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
              ⭐ +{results.xpEarned} XP 획득!
            </div>
          )}
        </div>
        <button
          className="btn btn-primary btn-xl"
          onClick={() => {
            setReviewMode(false);
            setReviewCategory(null);
          }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  // Review quiz mode
  if (reviewMode && questions.length > 0) {
    const question = questions[currentIndex];
    const catInfo = CATEGORIES[question.category as Category];

    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => {
            setReviewMode(false);
            setReviewCategory(null);
          }}>←</button>
          <h1>오답 복습</h1>
          <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        <div className="progress-bar" style={{ marginBottom: '24px' }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
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

  // Main wrong note list view
  return (
    <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="page-header">
        <h1>오답노트</h1>
        <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
          {store.wrongNotes.length}개
        </span>
      </div>

      {store.wrongNotes.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">✨</div>
          <div className="title">오답이 없어요!</div>
          <div className="desc">퀴즈를 풀면서 틀린 문제가<br/>여기에 모입니다.</div>
        </div>
      ) : (
        <>
          {/* Available for review */}
          {availableNotes.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝 복습 가능</span>
                <span className="badge badge-success">{availableNotes.length}개</span>
              </div>
              {Object.entries(availableGrouped).map(([category, notes]) => {
                const catInfo = CATEGORIES[category as Category];
                return (
                  <div key={category} className="section-card" style={{ cursor: 'pointer' }} onClick={() => startReview(category as Category)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>
                          {catInfo.icon} {catInfo.name}
                        </span>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {notes.length}문제 복습 가능
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm">복습하기</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending (cooldown) */}
          {pendingNotes.length > 0 && (() => {
            // 자정까지 남은 시간 계산 (KST)
            const now = new Date();
            const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const kstMidnight = new Date(kstNow);
            kstMidnight.setUTCHours(24, 0, 0, 0);
            const diffMs = kstMidnight.getTime() - kstNow.getTime();
            const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
            const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const timeText = hoursLeft > 0
              ? `${hoursLeft}시간 ${minutesLeft}분`
              : `${minutesLeft}분`;

            const pendingGrouped = pendingNotes.reduce((acc, note) => {
              acc[note.category] = (acc[note.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳ 대기 중</span>
                  <span className="badge badge-warning">{pendingNotes.length}개</span>
                </div>
                <div className="section-card">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-warning-light, #FFF8E1)',
                    marginBottom: '12px', fontSize: '14px',
                  }}>
                    <span style={{ fontSize: '20px' }}>🕐</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        복습 가능까지 <span style={{ color: 'var(--color-warning, #F59E0B)' }}>{timeText}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                        자정(00:00)에 복습 가능으로 전환돼요
                      </div>
                    </div>
                  </div>
                  <div>
                    {Object.entries(pendingGrouped).map(([category, count]) => {
                      const catInfo = CATEGORIES[category as Category];
                      return (
                        <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid var(--color-divider, #f0f0f0)' }}>
                          <span>{catInfo.icon} {catInfo.name}</span>
                          <span style={{ color: 'var(--color-text-tertiary)' }}>{count}문제</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/home')}>
          <span className="icon">🏠</span>
          <span>홈</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/category')}>
          <span className="icon">📝</span>
          <span>퀴즈</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/ranking')}>
          <span className="icon">🏆</span>
          <span>랭킹</span>
        </button>
        <button className="bottom-nav-item active">
          <span className="icon">📒</span>
          <span>오답노트</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/profile')}>
          <span className="icon">👤</span>
          <span>프로필</span>
        </button>
      </div>
    </div>
  );
}
