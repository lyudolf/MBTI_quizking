import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { getRank, getNextRank, getRankProgress } from '../utils/rankSystem';
import { CATEGORIES, Category } from '../types';
import mbtiStats from '../data/mbtiStats.json';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { AD_GROUP } from '../lib/ads';
import { Toast, useToast } from '../components/Toast';
import { calendarRewards, cyclePosition } from '../utils/attendanceReward';

const RANK_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇',
  platinum: '💎', diamond: '💠', master: '👑',
};

const RANK_NAMES: Record<string, string> = {
  bronze: '브론즈', silver: '실버', gold: '골드',
  platinum: '플래티넘', diamond: '다이아몬드', master: '마스터',
};

const MBTI_GROUP_COLORS: Record<string, string> = {
  INTJ: '#8B5CF6', INTP: '#8B5CF6', ENTJ: '#8B5CF6', ENTP: '#8B5CF6',
  INFJ: '#10B981', INFP: '#10B981', ENFJ: '#10B981', ENFP: '#10B981',
  ISTJ: '#3B82F6', ISFJ: '#3B82F6', ESTJ: '#3B82F6', ESFJ: '#3B82F6',
  ISTP: '#F59E0B', ISFP: '#F59E0B', ESTP: '#F59E0B', ESFP: '#F59E0B',
};

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname;

  const tabs = [
    { icon: '🏠', label: '홈', path: '/home' },
    { icon: '📝', label: '퀴즈', path: '/category' },
    { icon: '🏆', label: '랭킹', path: '/ranking' },
    { icon: '📒', label: '오답노트', path: '/wrong-notes' },
    { icon: '👤', label: '프로필', path: '/profile' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`bottom-nav-item ${current === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    nickname, mbtiType, totalXP, rank, equippedTitle, tickets,
    wrongNotes, dailyChallengeCompleted, currentStreak,
    categoryProgress, addAdTicket, unlockedTitles, dailyAdTicketsUsed,
  } = useGameStore();

  const { requestReward, loading: adLoading } = useRewardedAd(AD_GROUP.ticket);
  const { message, showToast } = useToast();

  const rankInfo = getRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const rankProgress = getRankProgress(totalXP);

  const stats = mbtiType ? (mbtiStats as Record<string, { avgAccuracy: number; strongCategory: string; weakCategory: string }>)[mbtiType] : null;

  // Calculate total answered and accuracy
  const totalAnswered = Object.values(categoryProgress).reduce((sum, p) => sum + p.totalAnswered, 0);
  const totalCorrect = Object.values(categoryProgress).reduce((sum, p) => sum + p.correctAnswered, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const mbtiColor = mbtiType ? MBTI_GROUP_COLORS[mbtiType] : 'var(--color-primary)';

  return (
    <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Profile Section */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: `${mbtiColor}18`,
              color: mbtiColor,
            }}
          >
            {mbtiType}
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          {nickname}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>{RANK_ICONS[rank] || RANK_ICONS.bronze}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {RANK_NAMES[rank] || '브론즈'}
          </span>
          {currentStreak > 0 && (
            <span className="streak-badge">🔥 {currentStreak}일 출석</span>
          )}
        </div>
        {equippedTitle && (
          <span className="title-badge" style={{ marginBottom: '8px' }}>
            {equippedTitle}
          </span>
        )}
      </div>

      {/* XP Progress */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '2px 10px', borderRadius: 'var(--radius-full)',
              background: `${rankInfo.color}20`, color: rankInfo.color,
              fontWeight: 800, fontSize: '14px',
            }}>
              {rankInfo.icon} {rankInfo.title}
            </span>
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
            {totalXP.toLocaleString()} XP
          </span>
        </div>
        <div className="progress-bar" style={{ marginTop: '8px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${rankProgress * 100}%`,
              background: `linear-gradient(90deg, ${rankInfo.color}, ${rankInfo.color}CC)`,
            }}
          />
        </div>
        {nextRank ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            <span>{Math.round(rankProgress * 100)}%</span>
            <span>다음 {nextRank.rank.icon} {nextRank.rank.title}까지 <b style={{ color: 'var(--color-primary)' }}>{nextRank.xpNeeded.toLocaleString()} XP</b></span>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--color-warning)', marginTop: '6px', textAlign: 'center', fontWeight: 600 }}>
            🏆 최고 등급 달성!
          </p>
        )}
      </div>

      {/* Ticket Display */}
      <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="section-card-title">🎟️ 티켓</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`ticket-display ${tickets === 0 ? 'empty' : ''}`}>
            🎟️ {tickets}장
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={adLoading}
            onClick={() => {
              if (dailyAdTicketsUsed >= 3) {
                showToast('오늘 받을 수 있는 광고 티켓을 다 받았어요.');
                return;
              }
              requestReward({
                onReward: () => {
                  const ok = addAdTicket();
                  showToast(ok ? '🎟️ 티켓 1장을 받았어요!' : '오늘 광고 티켓을 다 받았어요.');
                },
                onMessage: showToast,
              });
            }}
          >
            {adLoading ? '광고 불러오는 중...' : '📺 광고 보기'}
          </button>
        </div>
      </div>

      {/* 출석 보상 */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">📅 출석 보상</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>출석 {currentStreak}일째</span>
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
          {calendarRewards().map((r, i) => {
            const pos = i + 1;
            const cur = cyclePosition(currentStreak);
            const done = pos < cur;
            const isToday = pos === cur;
            return (
              <div
                key={pos}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '8px 2px',
                  borderRadius: 'var(--radius-md)',
                  background: isToday
                    ? 'var(--color-primary)'
                    : done
                      ? 'var(--color-primary-light, #EBF5FF)'
                      : 'var(--color-bg-tertiary, #F1F5F9)',
                  color: isToday ? '#fff' : 'var(--color-text)',
                }}
              >
                <div style={{ fontSize: '10px', opacity: 0.75 }}>{pos}일</div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
                  {r.tickets > 0 ? `🎟️${r.tickets}` : `⭐${r.xp}`}
                </div>
                <div style={{ fontSize: '10px', height: '12px', marginTop: '1px' }}>{done ? '✓' : ''}</div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '8px', textAlign: 'center' }}>
          매일 접속하면 보상이 쌓여요
        </p>
      </div>

      {/* Daily Challenge */}
      <div
        className="section-card"
        onClick={() => navigate('/daily')}
        style={{ cursor: 'pointer' }}
      >
        <div className="section-card-header">
          <span className="section-card-title">⚡ 오늘의 도전</span>
          <span className="badge badge-primary">무료</span>
        </div>
        <p className="section-card-subtitle">
          {dailyChallengeCompleted
            ? '✅ 오늘의 도전을 완료했어요!'
            : '매일 5문제, 지금 도전해보세요!'}
        </p>
      </div>

      {/* Quiz Start */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">📝 퀴즈 풀기</span>
        </div>
        <p className="section-card-subtitle" style={{ marginBottom: '12px' }}>
          카테고리를 선택하고 퀴즈에 도전하세요
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/category')}
        >
          퀴즈 시작
        </button>
      </div>

      {/* Wrong Note Card */}
      {wrongNotes.length > 0 && (
        <div
          className="section-card"
          onClick={() => navigate('/wrong-notes')}
          style={{ cursor: 'pointer' }}
        >
          <div className="section-card-header">
            <span className="section-card-title">📒 오답노트</span>
            <span className="badge badge-danger">{wrongNotes.length}개</span>
          </div>
          <p className="section-card-subtitle">
            틀린 문제를 복습하고 실력을 키워보세요
          </p>
        </div>
      )}

      {/* MBTI Ranking Card */}
      {stats && (
        <div className="mbti-compare-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div className="label">나의 정답률</div>
              <div className="value">{accuracy}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">{mbtiType} 평균</div>
              <div className="value">{Math.round(stats.avgAccuracy * 100)}%</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            💪 강점: {CATEGORIES[stats.strongCategory as Category]?.name} | 
            🎯 보완: {CATEGORIES[stats.weakCategory as Category]?.name}
          </div>
        </div>
      )}

      {/* Stats Mini Card */}
      <div className="section-card">
        <div className="section-card-header">
          <span className="section-card-title">📊 통계</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalAnswered}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>풀은 문제</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>정답률</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-warning)' }}>
              {unlockedTitles.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>칭호</div>
          </div>
        </div>
      </div>

      <Toast message={message} />
      <BottomNav />
    </div>
  );
}
