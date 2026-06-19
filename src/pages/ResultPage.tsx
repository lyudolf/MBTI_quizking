import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { CATEGORIES, Category } from '../types';
import { calculateXP } from '../utils/xpCalculator';
import { checkTitleUnlock, getTitleById } from '../utils/titleSystem';
import { syncMyRanking } from '../lib/ranking';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { Toast, useToast } from '../components/Toast';
import mbtiStats from '../data/mbtiStats.json';
import titlesData from '../data/titles.json';

interface QuizResult {
  questionId: string;
  correct: boolean;
  timeTaken: number;
}

interface LocationState {
  category: Category;
  results: QuizResult[];
  totalQuestions: number;
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2}s`,
      size: `${8 + Math.random() * 8}px`,
    }));
  }, []);

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userId, nickname, mbtiType, equippedTitle,
    totalXP: storeTotalXP,
    categoryProgress, unlockedTitles, addXP, equipTitle, tickets,
  } = useGameStore();
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [newTitle, setNewTitle] = useState<typeof titlesData[number] | null>(null);
  const [xpAdded, setXpAdded] = useState(false);
  const [xpDoubled, setXpDoubled] = useState(false);
  const { requestReward, loading: adLoading } = useRewardedAd();
  const { message, showToast } = useToast();

  const state = location.state as LocationState | undefined;

  useEffect(() => {
    if (!state) {
      navigate('/home', { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const { category, results, totalQuestions } = state;
  const correctCount = results.filter((r) => r.correct).length;
  const timeTakenArray = results.map((r) => r.timeTaken);
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  const scoreEmoji = correctCount >= 9 ? '🎉' : correctCount >= 7 ? '😊' : correctCount >= 5 ? '🤔' : '😢';
  const scoreMessage = correctCount >= 9 ? '완벽해요!' : correctCount >= 7 ? '잘했어요!' : correctCount >= 5 ? '괜찮아요!' : '다음엔 더 잘할 수 있어요!';

  // XP calculation
  const xpResult = useMemo(() => calculateXP(correctCount, timeTakenArray, totalQuestions), [correctCount, timeTakenArray, totalQuestions]);
  const totalXP = xpResult.total;
  const baseXP = xpResult.base;
  const timeBonus = xpResult.timeBonus;
  const perfectBonus = xpResult.perfectBonus;

  // MBTI stats
  const mbtiStat = mbtiType ? (mbtiStats as Record<string, { avgAccuracy: number }>)[mbtiType] : null;

  // Add XP once
  useEffect(() => {
    if (!xpAdded && totalXP > 0) {
      addXP(totalXP);
      setXpAdded(true);
    }
  }, [xpAdded, totalXP, addXP]);

  // Check title unlock
  useEffect(() => {
    if (xpAdded) {
      try {
        const newlyUnlocked = checkTitleUnlock(categoryProgress, unlockedTitles);
        if (newlyUnlocked) {
          const titleInfo = titlesData.find((t) => t.id === newlyUnlocked);
          if (titleInfo) {
            setNewTitle(titleInfo);
            setShowTitleModal(true);
          }
        }
      } catch {
        // title system not ready
      }
    }
  }, [xpAdded, categoryProgress, unlockedTitles]);

  // 누적 XP가 반영된 뒤(기본 + 광고 보너스 포함) 랭킹에 동기화
  useEffect(() => {
    if (!xpAdded || !userId || !nickname || !mbtiType) return;
    const titleName = equippedTitle ? getTitleById(equippedTitle)?.name ?? null : null;
    syncMyRanking({
      user_id: userId,
      nickname,
      mbti: mbtiType,
      xp: storeTotalXP,
      equipped_title: titleName,
    });
  }, [xpAdded, storeTotalXP, userId, nickname, mbtiType, equippedTitle]);

  const wrongCount = results.filter((r) => !r.correct).length;
  const catInfo = CATEGORIES[category];

  return (
    <div className="page">
      {correctCount >= 9 && <Confetti />}

      {/* Score Display */}
      <div className="result-score">
        <div className="emoji">{scoreEmoji}</div>
        <div className="score">
          <span className="highlight">{correctCount}</span> / {totalQuestions}
        </div>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
          {scoreMessage}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
          {catInfo.icon} {catInfo.name} | 정답률 {accuracy}%
        </p>
      </div>

      {/* XP Breakdown */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">⭐ 획득 경험치</span>
        </div>
        <div className="xp-section">
          <div className="xp-amount">+{totalXP} XP</div>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>기본 점수</span>
            <span style={{ fontWeight: 600 }}>+{baseXP}</span>
          </div>
          {timeBonus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>⚡ 시간 보너스</span>
              <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>+{timeBonus}</span>
            </div>
          )}
          {perfectBonus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>🎯 퍼펙트 보너스</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>+{perfectBonus}</span>
            </div>
          )}
        </div>
      </div>

      {/* MBTI Comparison */}
      {mbtiStat && (
        <div className="mbti-compare-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="label">나의 정답률</div>
              <div className="value">{accuracy}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">{mbtiType} 평균</div>
              <div className="value">{Math.round(mbtiStat.avgAccuracy * 100)}%</div>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {accuracy > Math.round(mbtiStat.avgAccuracy * 100)
              ? `🏆 ${mbtiType} 평균보다 높은 성적이에요!`
              : `💪 ${mbtiType} 평균에 도전해보세요!`}
          </div>
        </div>
      )}

      {/* Wrong Answers Notice */}
      {wrongCount > 0 && (
        <div className="section-card" style={{ borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-danger">{wrongCount}개</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              틀린 문제가 오답노트에 추가되었어요
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            내일부터 복습할 수 있어요
          </p>
        </div>
      )}

      {/* Ad for Double XP */}
      {!xpDoubled && totalXP > 0 && (
        <div
          style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform var(--transition-fast)',
          }}
          onClick={() => {
            if (adLoading) return;
            requestReward({
              onReward: () => {
                addXP(30);
                setXpDoubled(true);
                showToast('🎬 보너스 +30 XP 획득!');
              },
              onMessage: showToast,
            });
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#7C4A00', marginBottom: '4px' }}>
            {adLoading ? '광고 불러오는 중...' : '🎬 광고 보고 보너스 XP 받기'}
          </div>
          <div style={{ fontSize: '14px', color: '#9A6700' }}>
            +30 XP 추가 획득!
          </div>
        </div>
      )}

      {xpDoubled && (
        <div
          style={{
            marginTop: '16px',
            background: 'var(--color-success-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>
            ✅ 보너스 적용 완료! +30 XP
          </div>
        </div>
      )}

      <Toast message={message} />

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
          marginBottom: '4px', fontSize: '14px', color: 'var(--color-text-secondary)',
        }}>
          🎟️ 보유 티켓: <span style={{ fontWeight: 700, color: tickets > 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>{tickets}장</span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          disabled={tickets <= 0}
          onClick={() => {
            const success = useGameStore.getState().useTicket();
            if (success) {
              navigate(`/quiz?category=${category}`, { replace: true });
            } else {
              navigate('/category', { replace: true });
            }
          }}
        >
          🔄 다시 도전 (🎟️ 1장)
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/home', { replace: true })}
        >
          🏠 홈으로
        </button>
      </div>

      {/* Title Unlock Modal */}
      {showTitleModal && newTitle && (
        <div className="modal-overlay" onClick={() => setShowTitleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">{newTitle.icon}</div>
            <div className="modal-title">칭호 획득!</div>
            <p className="modal-desc">
              <strong>{newTitle.name}</strong><br />
              {newTitle.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  equipTitle(newTitle.id);
                  setShowTitleModal(false);
                }}
              >
                칭호 장착하기
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setShowTitleModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
