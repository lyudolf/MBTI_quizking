import type { RankType } from '../types';

export interface Rank {
  type: RankType;
  minXP: number;
  title: string;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { type: 'bronze',   minXP: 0,     title: '궁금한 초보', color: '#CD7F32', icon: '⭐' },
  { type: 'silver',   minXP: 500,   title: '동네 박사',   color: '#C0C0C0', icon: '🌟' },
  { type: 'gold',     minXP: 2000,  title: '상식 달인',   color: '#FFD700', icon: '💫' },
  { type: 'platinum', minXP: 5000,  title: '잡학 교수',   color: '#E5E4E2', icon: '💎' },
  { type: 'diamond',  minXP: 15000, title: '잡학박사',   color: '#B9F2FF', icon: '👑' },
  { type: 'master',   minXP: 50000, title: '전지전능',   color: '#FF6B6B', icon: '🏆' },
];

/**
 * 현재 XP에 해당하는 랭크 반환
 */
export function getRank(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * 다음 랭크 정보 반환. 최고 랭크이면 null.
 */
export function getNextRank(xp: number): { rank: Rank; xpNeeded: number } | null {
  const currentRank = getRank(xp);
  const currentIndex = RANKS.findIndex(r => r.type === currentRank.type);

  if (currentIndex >= RANKS.length - 1) {
    return null;
  }

  const nextRank = RANKS[currentIndex + 1];
  return {
    rank: nextRank,
    xpNeeded: nextRank.minXP - xp,
  };
}

/**
 * 현재 랭크 내 진행률 (0~1)
 * 현재 랭크의 minXP ~ 다음 랭크의 minXP 사이에서의 비율
 */
export function getRankProgress(xp: number): number {
  const currentRank = getRank(xp);
  const currentIndex = RANKS.findIndex(r => r.type === currentRank.type);

  if (currentIndex >= RANKS.length - 1) {
    return 1;
  }

  const nextRank = RANKS[currentIndex + 1];
  const rangeStart = currentRank.minXP;
  const rangeEnd = nextRank.minXP;
  const progress = (xp - rangeStart) / (rangeEnd - rangeStart);

  return Math.min(Math.max(progress, 0), 1);
}
