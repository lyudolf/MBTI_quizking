import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { getRank } from '../utils/rankSystem';
import { getTitleById } from '../utils/titleSystem';
import {
  isRankingEnabled,
  syncMyRanking,
  fetchTopRanking,
  fetchMyRank,
  type RankingRow,
} from '../lib/ranking';

const MBTI_COLORS: Record<string, string> = {
  INTJ: '#8B5CF6', INTP: '#8B5CF6', ENTJ: '#8B5CF6', ENTP: '#8B5CF6',
  INFJ: '#10B981', INFP: '#10B981', ENFJ: '#10B981', ENFP: '#10B981',
  ISTJ: '#3B82F6', ISFJ: '#3B82F6', ESTJ: '#3B82F6', ESFJ: '#3B82F6',
  ISTP: '#F59E0B', ISFP: '#F59E0B', ESTP: '#F59E0B', ESFP: '#F59E0B',
};

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
  const { userId, mbtiType, totalXP, nickname, equippedTitle } = useGameStore();
  const [filter, setFilter] = useState<string>('all');
  const [rows, setRows] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const equippedTitleObj = equippedTitle ? getTitleById(equippedTitle) : null;
  const equippedTitleName = equippedTitleObj ? equippedTitleObj.name : null;

  // 내 점수는 한 번만 서버에 반영
  const synced = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isRankingEnabled()) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // 1) 내 최신 점수 upsert (최초 1회)
      if (!synced.current && nickname && mbtiType) {
        await syncMyRanking({
          user_id: userId,
          nickname,
          mbti: mbtiType,
          xp: totalXP,
          equipped_title: equippedTitleName,
        });
        synced.current = true;
      }

      // 2) 상위 랭킹 + 내 정확한 순위 조회
      //    내 순위는 통합이거나 "내 유형"일 때만 의미가 있음 (다른 유형엔 내가 없음)
      const mbtiParam = filter === 'all' ? undefined : filter;
      const myStanding = filter === 'all' || filter === mbtiType;
      const [top, rank] = await Promise.all([
        fetchTopRanking(100, mbtiParam),
        myStanding ? fetchMyRank(totalXP, mbtiParam) : Promise.resolve(0),
      ]);

      if (cancelled) return;

      const mapped: RankEntry[] = top.map((r: RankingRow) => ({
        nickname: r.nickname,
        mbti: r.mbti,
        xp: r.xp,
        equippedTitle: r.equipped_title,
        isMe: r.user_id === userId,
      }));

      setRows(mapped);
      setMyRank(rank);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, userId, nickname, mbtiType, totalXP, equippedTitleName]);

  const iAmInList = useMemo(() => rows.some((r) => r.isMe), [rows]);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const rank = getRank(totalXP);
  // 내 순위 카드는 통합 또는 내 유형일 때만 (다른 유형 구경 시엔 숨김)
  const showMyStanding = filter === 'all' || filter === mbtiType;

  // 랭킹 서버 미연결 (환경변수 없음)
  if (!isRankingEnabled()) {
    return (
      <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="page-header">
          <h1>🏆 랭킹</h1>
        </div>
        <div className="empty-state">
          <div className="emoji">🛠️</div>
          <div className="title">랭킹 준비 중</div>
          <div className="desc">곧 실시간 랭킹으로 만나요!</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
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

      {/* My Summary — 통합/내 유형일 때만 내 순위, 남의 유형이면 '구경 중' 카드 */}
      {showMyStanding ? (
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
                {filter === 'all' ? '통합 랭킹' : `내 ${filter} 랭킹`}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900 }}>
                {myRank > 0 ? (
                  <>
                    {myRank}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.7 }}>위</span>
                  </>
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>순위 집계 중</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalXP.toLocaleString()}</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>XP</div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-bg-secondary, #F1F5F9)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ fontSize: '24px' }}>👀</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {filter} 유형 랭킹
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              내 유형은 {mbtiType}예요 · 다른 유형 구경 중
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', animation: 'pulse 1s ease-in-out infinite alternate' }}>🏆</div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>랭킹을 불러오는 중...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🥇</div>
          <div className="title">
            {filter === 'all' ? '아직 랭커가 없어요' : '해당 유형 유저가 없어요'}
          </div>
          <div className="desc">첫 번째 도전자가 되어보세요!</div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && rows.length >= 3 && <Podium entries={top3} />}

      {/* Rest of Ranking (4th+) */}
      {!loading && rest.length > 0 && (
        <div className="section-card" style={{ padding: '4px 8px', overflow: 'visible' }}>
          {rest.map((entry, idx) => {
            const position = idx + 4;
            const entryRank = getRank(entry.xp);

            return (
              <div
                key={`${entry.nickname}-${idx}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxSizing: 'border-box',
                  width: '100%',
                  background: entry.isMe ? 'var(--color-primary-light, #EBF5FF)' : 'transparent',
                  borderLeft: entry.isMe ? '4px solid var(--color-primary)' : '4px solid transparent',
                  borderBottom: '1px solid var(--color-divider, #f0f0f0)',
                  margin: '0',
                  padding: '10px 8px',
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

      {/* 상위 100명 밖일 때 안내 */}
      {!loading && rows.length > 0 && !iAmInList && myRank > 0 && (
        <div style={{
          marginTop: '12px', padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-secondary, #F8F9FA)',
          fontSize: '13px', color: 'var(--color-text-secondary)',
          textAlign: 'center',
        }}>
          내 순위는 <b style={{ color: 'var(--color-primary)' }}>{myRank}위</b> 예요. 상위 100위 안에 도전해보세요! 💪
        </div>
      )}

      <BottomNav />
    </div>
  );
}
