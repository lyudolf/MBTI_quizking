import type { RankType } from '../types';
import type { CategoryProgress, Category, WrongNote } from '../types';

export interface GameState {
  nickname: string | null;
  mbtiType: string | null;
  totalXP: number;
  rank: RankType;
  equippedTitle: string | null;
  unlockedTitles: string[];
  tickets: number;
  dailyFreeTicketsUsed: number;
  dailyAdTicketsUsed: number;
  categoryProgress: Record<Category, CategoryProgress>;
  wrongNotes: WrongNote[];
  dailyChallengeCompleted: boolean;
  lastPlayDate: string;
  currentStreak: number;
  longestStreak: number;
}

const DAILY_FREE_TICKETS = 3;

/**
 * 오늘 날짜를 KST(한국 표준시) 기준 YYYY-MM-DD 형식으로 반환
 */
export function getTodayKST(): string {
  const now = new Date();
  // KST = UTC + 9
  const kstOffset = 9 * 60;
  const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
  const kstDate = new Date((utcMinutes + kstOffset) * 60000);

  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 두 날짜 문자열(YYYY-MM-DD) 사이의 일수 차이 계산.
 * dateB - dateA 를 반환.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 일일 초기화 확인 및 상태 업데이트 반환.
 * lastPlayDate와 오늘(KST)이 다르면 초기화 수행.
 * 변경이 없으면 null 반환.
 */
export function checkAndResetDaily(state: GameState): Partial<GameState> | null {
  const today = getTodayKST();

  if (state.lastPlayDate === today) {
    return null;
  }

  const gap = daysBetween(state.lastPlayDate, today);

  let newStreak: number;
  if (gap === 1) {
    // 연속 출석
    newStreak = state.currentStreak + 1;
  } else {
    // 하루 이상 빠짐 → 스트릭 리셋
    newStreak = 1;
  }

  const longestStreak = Math.max(state.longestStreak, newStreak);

  return {
    tickets: state.tickets + DAILY_FREE_TICKETS,
    dailyFreeTicketsUsed: 0,
    dailyAdTicketsUsed: 0,
    dailyChallengeCompleted: false,
    lastPlayDate: today,
    currentStreak: newStreak,
    longestStreak,
  };
}
