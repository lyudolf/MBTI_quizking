import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { CATEGORIES, Category } from '../types';
import { getRank, getNextRank, getRankProgress } from '../utils/rankSystem';
import { getAllTitles, getTitleById } from '../utils/titleSystem';
import { calculatePercentile } from '../utils/mbtiRanking';
import mbtiStats from '../data/mbtiStats.json';

function getMbtiGroup(type: string): string {
  const nt = ['INTJ', 'INTP', 'ENTJ', 'ENTP'];
  const nf = ['INFJ', 'INFP', 'ENFJ', 'ENFP'];
  const sj = ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'];
  if (nt.includes(type)) return 'analyst';
  if (nf.includes(type)) return 'diplomat';
  if (sj.includes(type)) return 'sentinel';
  return 'explorer';
}

function getMbtiGroupColor(group: string): string {
  switch (group) {
    case 'analyst': return 'var(--mbti-analyst)';
    case 'diplomat': return 'var(--mbti-diplomat)';
    case 'sentinel': return 'var(--mbti-sentinel)';
    case 'explorer': return 'var(--mbti-explorer)';
    default: return 'var(--color-primary)';
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const [editMode, setEditMode] = useState<'nickname' | 'mbti' | null>(null);
  const [editNickname, setEditNickname] = useState(store.nickname || '');

  const rank = getRank(store.totalXP);
  const nextRank = getNextRank(store.totalXP);
  const rankProgress = getRankProgress(store.totalXP);
  const allTitles = getAllTitles();

  const totalQuestions = useMemo(() => {
    return Object.values(store.categoryProgress).reduce((sum, p) => sum + p.totalAnswered, 0);
  }, [store.categoryProgress]);

  const totalCorrect = useMemo(() => {
    return Object.values(store.categoryProgress).reduce((sum, p) => sum + p.correctAnswered, 0);
  }, [store.categoryProgress]);

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;



  const userPercentile = useMemo(() => {
    if (!store.mbtiType || totalQuestions === 0) return 0;
    return calculatePercentile(store.totalXP, store.mbtiType, mbtiStats);
  }, [store.mbtiType, store.totalXP, totalQuestions]);

  const mbtiGroup = store.mbtiType ? getMbtiGroup(store.mbtiType) : 'analyst';
  const mbtiColor = getMbtiGroupColor(mbtiGroup);

  const handleSaveNickname = () => {
    if (editNickname.length >= 2 && editNickname.length <= 8) {
      store.updateNickname(editNickname);
      setEditMode(null);
    }
  };

  const equippedTitleObj = store.equippedTitle ? getTitleById(store.equippedTitle) : null;

  return (
    <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="page-header">
        <h1>프로필</h1>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div
          className="mbti-badge-large"
          style={{ background: mbtiColor, color: 'white' }}
        >
          {store.mbtiType}
        </div>
        <div className="nickname">{store.nickname}</div>
        {equippedTitleObj && (
          <div className="title-badge">
            {equippedTitleObj.icon} {equippedTitleObj.name}
          </div>
        )}
        <div style={{ marginTop: '8px' }}>
          <span className="badge badge-primary">{rank.icon} {rank.title}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="profile-stat-row">
        <div className="profile-stat-item">
          <div className="value">{store.totalXP.toLocaleString()}</div>
          <div className="label">총 XP</div>
        </div>
        <div className="profile-stat-item">
          <div className="value">{totalQuestions}</div>
          <div className="label">푼 문제</div>
        </div>
        <div className="profile-stat-item">
          <div className="value">{accuracy}%</div>
          <div className="label">정답률</div>
        </div>
        <div className="profile-stat-item">
          <div className="value">{store.currentStreak}일</div>
          <div className="label">출석 일수</div>
        </div>
      </div>

      {/* Rank Progress */}
      {nextRank && (
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">{rank.icon} {rank.title}</span>
            <span className="section-card-subtitle">{nextRank.rank.icon} {nextRank.rank.title}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${rankProgress * 100}%` }} />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px', textAlign: 'right' }}>
            다음 랭크까지 {nextRank.xpNeeded.toLocaleString()} XP
          </div>
        </div>
      )}

      {/* MBTI 내 랭킹 */}
      <div className="section-card" style={{ marginTop: '16px' }}>
        <div className="section-card-header">
          <span className="section-card-title">🏆 {store.mbtiType} 내 랭킹</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '16px 0',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-primary)' }}>
              상위 {Math.round(userPercentile)}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              {store.mbtiType} 유저 중
            </div>
          </div>
          <div style={{
            width: '1px', height: '40px',
            background: 'var(--color-divider, #e0e0e0)',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text)' }}>
              {store.totalXP.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              총 XP
            </div>
          </div>
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--color-text-tertiary)',
          textAlign: 'center', paddingTop: '8px',
          borderTop: '1px solid var(--color-divider, #f0f0f0)',
        }}>
          📌 시뮬레이션 데이터 · 정식 출시 시 실시간 순위 반영
        </div>
      </div>

      {/* Category Progress */}
      <div className="section-card" style={{ marginTop: '16px' }}>
        <div className="section-card-header">
          <span className="section-card-title">📊 카테고리별 진행</span>
        </div>
        {(Object.entries(CATEGORIES) as [Category, { name: string; icon: string }][]).map(([key, cat]) => {
          const progress = store.categoryProgress[key];
          const pct = Math.round((progress.correctAnswered / 300) * 100);
          return (
            <div key={key} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span>{cat.icon} {cat.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{progress.correctAnswered}/300</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: progress.correctAnswered >= 300
                      ? 'var(--color-success)'
                      : 'linear-gradient(90deg, var(--color-primary), #60A5FA)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Title Collection */}
      <div className="section-card" style={{ marginTop: '16px' }}>
        <div className="section-card-header">
          <span className="section-card-title">🎖️ 칭호 컬렉션</span>
          <span className="section-card-subtitle">{store.unlockedTitles.length}/{allTitles.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          {allTitles.map((title) => {
            const unlocked = store.unlockedTitles.includes(title.id);
            const equipped = store.equippedTitle === title.id;
            return (
              <div
                key={title.id}
                className={`title-badge ${unlocked ? '' : 'locked'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: unlocked ? 'pointer' : 'default',
                  border: equipped ? '2px solid var(--color-primary)' : '1px solid transparent',
                }}
                onClick={() => {
                  if (unlocked && !equipped) {
                    store.equipTitle(title.id);
                  }
                }}
              >
                <span style={{ fontSize: '24px', marginBottom: '4px' }}>{title.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{title.name}</span>
                {equipped && (
                  <span style={{ fontSize: '11px', marginTop: '2px' }}>착용 중</span>
                )}
                {!unlocked && (
                  <span style={{ fontSize: '11px', marginTop: '2px' }}>🔒 미해금</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => {
          setEditMode('nickname');
          setEditNickname(store.nickname || '');
        }}>
          닉네임 변경
        </button>
        <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => setEditMode('mbti')}>
          성격유형 변경
        </button>
      </div>

      {/* Edit Nickname Modal */}
      {editMode === 'nickname' && (
        <div className="modal-overlay" onClick={() => setEditMode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">닉네임 변경</div>
            <input
              className={`text-input ${editNickname.length > 0 && (editNickname.length < 2 || editNickname.length > 8) ? 'error' : ''}`}
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              placeholder="새 닉네임 (2~8자)"
              maxLength={8}
            />
            <div className="input-helper" style={{ marginBottom: '16px' }}>
              {editNickname.length}/8자
            </div>
            <button
              className="btn btn-primary btn-lg"
              disabled={editNickname.length < 2 || editNickname.length > 8}
              onClick={handleSaveNickname}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Edit MBTI Modal */}
      {editMode === 'mbti' && (
        <div className="modal-overlay" onClick={() => setEditMode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">성격유형 변경</div>
            <div className="mbti-grid" style={{ marginBottom: '16px' }}>
              {['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map((type) => {
                const group = getMbtiGroup(type);
                return (
                  <button
                    key={type}
                    className={`mbti-chip ${group} ${store.mbtiType === type ? 'selected' : ''}`}
                    onClick={() => {
                      store.updateMbtiType(type);
                      setEditMode(null);
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
        <button className="bottom-nav-item" onClick={() => navigate('/wrong-notes')}>
          <span className="icon">📒</span>
          <span>오답노트</span>
        </button>
        <button className="bottom-nav-item active">
          <span className="icon">👤</span>
          <span>프로필</span>
        </button>
      </div>
    </div>
  );
}
