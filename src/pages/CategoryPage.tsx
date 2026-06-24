import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { CATEGORIES, Category } from '../types';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { AD_GROUP } from '../lib/ads';
import { Toast, useToast } from '../components/Toast';

export default function CategoryPage() {
  const navigate = useNavigate();
  const { tickets, categoryProgress, useTicket, addAdTicket, dailyAdTicketsUsed } = useGameStore();
  const [showModal, setShowModal] = useState(false);
  const { requestReward, loading: adLoading } = useRewardedAd(AD_GROUP.ticket);
  const { message, showToast } = useToast();

  const handleCategorySelect = (category: Category) => {
    if (tickets > 0) {
      useTicket();
      navigate(`/quiz?category=${category}`);
    } else {
      setShowModal(true);
    }
  };

  const handleAdTicket = () => {
    if (dailyAdTicketsUsed >= 3) {
      showToast('오늘 받을 수 있는 광고 티켓을 다 받았어요.');
      return;
    }
    requestReward({
      onReward: () => {
        const ok = addAdTicket();
        if (ok) {
          setShowModal(false);
          showToast('🎟️ 티켓 1장을 받았어요!');
        } else {
          showToast('오늘 광고 티켓을 다 받았어요.');
        }
      },
      onMessage: showToast,
    });
  };

  const categories = Object.entries(CATEGORIES) as [Category, { name: string; icon: string }][];

  return (
    <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="page-header">
        <h1>카테고리 선택</h1>
        <div style={{ marginLeft: 'auto' }}>
          <span className={`ticket-display ${tickets === 0 ? 'empty' : ''}`}>
            🎟️ {tickets}장
          </span>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        카테고리를 선택하면 티켓 1장이 소모돼요
      </p>

      {/* Category Grid */}
      <div className="category-grid">
        {categories.map(([key, cat]) => {
          const progress = categoryProgress[key];
          const answered = progress?.totalAnswered || 0;
          const correct = progress?.correctAnswered || 0;
          const isCompleted = correct >= 300;
          const percent = Math.min((answered / 300) * 100, 100);

          return (
            <div
              key={key}
              className={`category-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleCategorySelect(key)}
            >
              {isCompleted && (
                <div style={{
                  position: 'absolute', top: '8px', right: '8px',
                  fontSize: '16px',
                }}>
                  ✅
                </div>
              )}
              <div className="icon">{cat.icon}</div>
              <div className="name">{cat.name}</div>
              <div className="progress-text">{answered}/300</div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${percent}%`,
                    background: isCompleted
                      ? 'var(--color-success)'
                      : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* No Ticket Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">🎟️</div>
            <div className="modal-title">티켓이 부족해요</div>
            <p className="modal-desc">
              퀴즈를 풀려면 티켓이 필요해요.<br />
              광고를 보고 무료 티켓을 받아보세요!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary btn-lg" disabled={adLoading} onClick={handleAdTicket}>
                {adLoading ? '광고 불러오는 중...' : '📺 광고 보고 티켓 받기'}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setShowModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} />

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/home')}>
          <span className="icon">🏠</span>홈
        </button>
        <button className="bottom-nav-item active">
          <span className="icon">📝</span>퀴즈
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/ranking')}>
          <span className="icon">🏆</span>랭킹
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/wrong-notes')}>
          <span className="icon">📒</span>오답노트
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/profile')}>
          <span className="icon">👤</span>프로필
        </button>
      </nav>
    </div>
  );
}
