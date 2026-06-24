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
 * 일일 초기화 확인 및 상태 업데이트 반환.
 * lastPlayDate와 오늘(KST)이 다르면 초기화 수행.
 * 변경이 없으면 null 반환.
 *
 * 출석은 "누적" — 하루 빠져도 끊기지 않고, 새로운 날 접속할 때마다 +1.
 */
export function checkAndResetDaily(state: GameState): Partial<GameState> | null {
  const today = getTodayKST();

  if (state.lastPlayDate === today) {
    return null;
  }

  // 누적 출석 (하루 빠져도 리셋 안 함)
  const newStreak = state.currentStreak + 1;
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
