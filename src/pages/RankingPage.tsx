import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { getRank } from '../utils/rankSystem';
import { getTitleById } from '../utils/titleSystem';

const MBTI_COLORS: Record<string, string> = {
  INTJ: '#8B5CF6', INTP: '#8B5CF6', ENTJ: '#8B5CF6', ENTP: '#8B5CF6',
  INFJ: '#10B981', INFP: '#10B981', ENFJ: '#10B981', ENFP: '#10B981',
  ISTJ: '#3B82F6', ISFJ: '#3B82F6', ESTJ: '#3B82F6', ESFJ: '#3B82F6',
  ISTP: '#F59E0B', ISFP: '#F59E0B', ESTP: '#F59E0B', ESFP: '#F59E0B',
};

const SIMULATED_USERS = [
  { nickname: '퀴즈천재김씨', mbti: 'ENTJ', xp: 52300, equippedTitle: '워렌버핏의 후계자' },
  { nickname: '상식왕이다', mbti: 'INTJ', xp: 48100, equippedTitle: '아인슈타인의 후예' },
  { nickname: '문과의자존심', mbti: 'INFJ', xp: 41200, equippedTitle: '시간여행자' },
  { nickname: '호기심대마왕', mbti: 'ENTP', xp: 37800, equippedTitle: '실리콘밸리 인재' },
  { nickname: '돌고래뇌섹', mbti: 'INTP', xp: 34500, equippedTitle: null },
  { nickname: '지식흡수왕', mbti: 'ESTJ', xp: 29800, equippedTitle: null },
  { nickname: '달빛지식인', mbti: 'INFP', xp: 25400, equippedTitle: '르네상스 영혼' },
  { nickname: '새벽공부왕', mbti: 'ISTJ', xp: 21000, equippedTitle: null },
  { nickname: '퀴즈러버88', mbti: 'ENFP', xp: 17600, equippedTitle: null },
  { nickname: '브레인스톰', mbti: 'ENTJ', xp: 14200, equippedTitle: null },
  { nickname: '상식덕후', mbti: 'ISFJ', xp: 11500, equippedTitle: null },
  { nickname: '알쓸신잡팬', mbti: 'ENFJ', xp: 9200, equippedTitle: null },
  { nickname: '궁금한고양이', mbti: 'ESFJ', xp: 7100, equippedTitle: null },
  { nickname: '잡학다식맨', mbti: 'ISTP', xp: 5400, equippedTitle: null },
  { nickname: '도전정신왕', mbti: 'ESTP', xp: 3800, equippedTitle: null },
  { nickname: '초보퀴즈러', mbti: 'ISFP', xp: 2100, equippedTitle: null },
  { nickname: '두뇌풀가동', mbti: 'INTJ', xp: 19500, equippedTitle: null },
  { nickname: '지식탐험가', mbti: 'ENTP', xp: 12800, equippedTitle: null },
  { nickname: '분석의달인', mbti: 'INTP', xp: 8900, equippedTitle: null },
  { nickname: '논리왕자', mbti: 'ENTJ', xp: 6300, equippedTitle: null },
  { nickname: '사색가', mbti: 'INFP', xp: 4200, equippedTitle: null },
  { nickname: '첫도전중', mbti: 'ESFP', xp: 800, equippedTitle: null },
  { nickname: '방금시작', mbti: 'ISFP', xp: 200, equippedTitle: null },
  { nickname: '문화통달자', mbti: 'ENFJ', xp: 16400, equippedTitle: null },
  { nickname: '역사매니아', mbti: 'ISTJ', xp: 13700, equippedTitle: null },
  { nickname: '생활백서', mbti: 'ESFJ', xp: 10200, equippedTitle: null },
  { nickname: '과학소년', mbti: 'ISTP', xp: 7800, equippedTitle: null },
  { nickname: '호기심냥이', mbti: 'ENFP', xp: 6800, equippedTitle: null },
  { nickname: '경제박사꿈', mbti: 'ESTJ', xp: 15300, equippedTitle: null },
  { nickname: '예술의혼', mbti: 'ISFP', xp: 4800, equippedTitle: null },
];

const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

interface RankEntry {
  nickname: string;
  mbti: string;
  xp: number;
  equippedTitle: string | null;
  isMe: boolean;
}

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

function Podium({ entries }: { entries: RankEntry[] }) {
  if (entries.length < 3) return null;
  const [first, second, third] = [entries[0], entries[1], entries[2]];

  const renderPodiumItem = (entry: RankEntry, position: number) => {
    const rank = getRank(entry.xp);
    const heights = [140, 110, 90];
    const sizes = [52, 44, 40];
    const medals = ['🥇', '🥈', '🥉'];
    const bgColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const h = heights[position];
    const s = sizes[position];
    const mbtiColor = MBTI_COLORS[entry.mbti] || '#888';

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flex: 1, gap: '4px',
      }}>
        {/* Medal + Rank Icon */}
        <div style={{ fontSize: position === 0 ? '28px' : '22px' }}>{medals[position]}</div>
        <div style={{
          width: `${s}px`, height: `${s}px`, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: position === 0 ? '26px' : '20px',
          background: entry.isMe
            ? 'linear-gradient(135deg, var(--color-primary), #60A5FA)'
            : `linear-gradient(135deg, ${bgColors[position]}40, ${bgColors[position]}20)`,
          border: entry.isMe ? '3px solid var(--color-primary)' : `2px solid ${bgColors[position]}80`,
        }}>
          {rank.icon}
        </div>

        {/* Podium bar with info inside */}
        <div style={{
          width: '100%', height: `${h}px`,
          borderRadius: '10px 10px 0 0',
          background: entry.isMe
            ? 'linear-gradient(180deg, var(--color-primary), #93C5FD)'
            : `linear-gradient(180deg, ${bgColors[position]}50, ${bgColors[position]}15)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '10px 6px 0',
          gap: '3px',
        }}>
          {/* MBTI Badge */}
          <span style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
            padding: '1px 6px', borderRadius: '4px',
            background: `${mbtiColor}30`,
            color: entry.isMe ? 'white' : mbtiColor,
            border: entry.isMe ? '1px solid rgba(255,255,255,0.4)' : 'none',
          }}>
            {entry.mbti}
          </span>

          {/* Title */}
          {entry.equippedTitle && (
            <span style={{
              fontSize: '9px', fontWeight: 700,
              padding: '1px 4px', borderRadius: '3px',
              background: 'rgba(255,255,255,0.3)',
              color: entry.isMe ? 'white' : '#7C4A00',
              whiteSpace: 'nowrap', maxWidth: '85px',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {entry.equippedTitle}
            </span>
          )}

          {/* Name */}
          <div style={{
            fontSize: position === 0 ? '12px' : '11px', fontWeight: 700,
            color: entry.isMe ? 'white' : 'var(--color-text)',
            maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entry.nickname}
          </div>

          {/* XP */}
          <div style={{
            fontSize: '11px', fontWeight: 800,
            color: entry.isMe ? 'rgba(255,255,255,0.9)' : 'var(--color-text-secondary)',
          }}>
            {entry.xp.toLocaleString()} XP
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: '8px',
      padding: '0 16px', marginBottom: '16px',
    }}>
      {renderPodiumItem(second, 1)}
      {renderPodiumItem(first, 0)}
      {renderPodiumItem(third, 2)}
    </div>
  );
}

export default function RankingPage() {
  const { mbtiType, totalXP, nickname, equippedTitle } = useGameStore();
  const [filter, setFilter] = useState<string>('all');

  const equippedTitleObj = equippedTitle ? getTitleById(equippedTitle) : null;
  const equippedTitleName = equippedTitleObj ? equippedTitleObj.name : null;

  const allRanking = useMemo<RankEntry[]>(() => {
    const me: RankEntry = {
      nickname: nickname || '나',
      mbti: mbtiType || '????',
      xp: totalXP,
      equippedTitle: equippedTitleName,
      isMe: true,
    };
    const others: RankEntry[] = SIMULATED_USERS.map((u) => ({ ...u, isMe: false }));
    const all = [...others, me];
    all.sort((a, b) => b.xp - a.xp);
    return all;
  }, [nickname, mbtiType, totalXP, equippedTitleName]);

  const filteredRanking = useMemo(() => {
    if (filter === 'all') return allRanking;
    return allRanking.filter((r) => r.mbti === filter);
  }, [allRanking, filter]);

  const myRankAll = allRanking.findIndex((r) => r.isMe) + 1;
  const myRankFiltered = filteredRanking.findIndex((r) => r.isMe) + 1;
  const myRank = filter === 'all' ? myRankAll : myRankFiltered;
  const totalCount = filteredRanking.length;

  const top3 = filteredRanking.slice(0, 3);
  const rest = filteredRanking.slice(3);

  const rank = getRank(totalXP);

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div className="page-header">
        <h1>🏆 랭킹</h1>
      </div>

      {/* Filter */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto',
        padding: '0 0 12px', WebkitOverflowScrolling: 'touch',
      }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter('all')}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          통합
        </button>
        {MBTI_TYPES.map((type) => (
          <button
            key={type}
            className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(type)}
            style={{
              whiteSpace: 'nowrap', flexShrink: 0,
              fontWeight: type === mbtiType ? 800 : 400,
            }}
          >
            {type}{type === mbtiType ? ' ⭐' : ''}
          </button>
        ))}
      </div>

      {/* My Summary */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), #60A5FA)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        color: 'white',
        marginBottom: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>{rank.icon}</div>
          <div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>
              {filter === 'all' ? '통합 랭킹' : `${filter} 랭킹`}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900 }}>
              {myRank}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.7 }}>위</span>
              <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.5, marginLeft: '4px' }}>/ {totalCount}명</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalXP.toLocaleString()}</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>XP</div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {filteredRanking.length >= 3 && <Podium entries={top3} />}

      {/* Rest of Ranking (4th+) */}
      {rest.length > 0 && (
        <div className="section-card" style={{ padding: '4px 8px', overflow: 'visible' }}>
          {rest.map((entry, idx) => {
            const position = idx + 4;
            const entryRank = getRank(entry.xp);

            return (
              <div
                key={`${entry.nickname}-${idx}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 4px',
                  borderRadius: 'var(--radius-md)',
                  background: entry.isMe ? 'var(--color-primary-light, #EBF5FF)' : 'transparent',
                  border: entry.isMe ? '2px solid var(--color-primary)' : 'none',
                  borderBottom: !entry.isMe ? '1px solid var(--color-divider, #f0f0f0)' : 'none',
                  margin: entry.isMe ? '6px -4px' : '0',
                  padding: entry.isMe ? '10px 8px' : '10px 4px',
                }}
              >
                <div style={{
                  width: '28px', textAlign: 'center',
                  fontSize: '14px', fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                }}>
                  {position}
                </div>

                {/* MBTI - left column */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '2px', width: '44px', flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
                    padding: '2px 6px', borderRadius: '4px',
                    background: `${MBTI_COLORS[entry.mbti] || '#888'}20`,
                    color: MBTI_COLORS[entry.mbti] || '#888',
                  }}>
                    {entry.mbti}
                  </span>
                  <div style={{ fontSize: '14px' }}>{entryRank.icon}</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {entry.equippedTitle && (
                    <div style={{
                      fontSize: '10px', fontWeight: 700,
                      color: 'var(--color-warning, #D97706)',
                      marginBottom: '1px',
                    }}>
                      {entry.equippedTitle}
                    </div>
                  )}
                  <div style={{
                    fontSize: '14px', fontWeight: entry.isMe ? 800 : 500,
                    color: entry.isMe ? 'var(--color-primary)' : 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.nickname}{entry.isMe ? ' 👈' : ''}
                  </div>
                </div>

                <div style={{
                  fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
                  color: entry.isMe ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}>
                  {entry.xp.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRanking.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🏆</div>
          <div className="title">해당 MBTI 유저가 없어요</div>
        </div>
      )}

      {/* Info */}
      <div style={{
        marginTop: '12px', padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-secondary, #F8F9FA)',
        fontSize: '12px', color: 'var(--color-text-tertiary)',
        textAlign: 'center',
      }}>
        📌 시뮬레이션 랭킹 · 정식 출시 시 실시간 랭킹 전환
      </div>

      <BottomNav />
    </div>
  );
}
