import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, CategoryProgress, RankType, WrongNote } from '../types';
import { CATEGORIES } from '../types';
import { getRank } from '../utils/rankSystem';
import { checkTitleUnlock } from '../utils/titleSystem';
import { checkAndResetDaily, getTodayKST } from '../utils/dailyReset';

const DAILY_FREE_TICKETS = 3;
const MAX_AD_TICKETS = 3;

/** 랭킹에서 유저를 식별하기 위한 안정적 ID 생성 (Toss 인증 붙이면 교체) */
function generateUserId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialCategoryProgress(): Record<Category, CategoryProgress> {
  const progress = {} as Record<Category, CategoryProgress>;
  for (const key of Object.keys(CATEGORIES) as Category[]) {
    progress[key] = {
      totalAnswered: 0,
      correctAnswered: 0,
      answeredIds: [],
    };
  }
  return progress;
}

export interface GameState {
  userId: string;
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

interface GameActions {
  setOnboarding: (nickname: string, mbtiType: string) => void;
  useTicket: () => boolean;
  refundTicket: () => void;
  addAdTicket: () => boolean;
  addXP: (amount: number) => void;
  recordAnswer: (questionId: string, category: Category, correct: boolean) => void;
  removeWrongNote: (questionId: string) => void;
  updateWrongNoteDate: (questionId: string) => void;
  completeDailyChallenge: () => void;
  equipTitle: (titleId: string) => void;
  updateNickname: (name: string) => void;
  updateMbtiType: (type: string) => void;
  checkDailyReset: () => void;
  ensureUserId: () => void;
}

const initialState: GameState = {
  userId: '',
  nickname: null,
  mbtiType: null,
  totalXP: 0,
  rank: 'bronze',
  equippedTitle: null,
  unlockedTitles: [],
  tickets: 3,
  dailyFreeTicketsUsed: 0,
  dailyAdTicketsUsed: 0,
  categoryProgress: createInitialCategoryProgress(),
  wrongNotes: [],
  dailyChallengeCompleted: false,
  lastPlayDate: getTodayKST(),
  currentStreak: 1,
  longestStreak: 1,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOnboarding: (nickname: string, mbtiType: string) => {
        set({ nickname, mbtiType });
      },

      useTicket: (): boolean => {
        const state = get();
        if (state.tickets <= 0) {
          return false;
        }
        set({
          tickets: state.tickets - 1,
          dailyFreeTicketsUsed: state.dailyFreeTicketsUsed + 1,
        });
        return true;
      },

      addAdTicket: (): boolean => {
        const state = get();
        if (state.dailyAdTicketsUsed >= MAX_AD_TICKETS) {
          return false;
        }
        set({
          tickets: state.tickets + 1,
          dailyAdTicketsUsed: state.dailyAdTicketsUsed + 1,
        });
        return true;
      },

      refundTicket: () => {
        const state = get();
        set({
          tickets: state.tickets + 1,
          dailyFreeTicketsUsed: Math.max(0, state.dailyFreeTicketsUsed - 1),
        });
      },

      addXP: (amount: number) => {
        const state = get();
        const newXP = state.totalXP + amount;
        const newRank = getRank(newXP);
        set({
          totalXP: newXP,
          rank: newRank.type,
        });
      },

      recordAnswer: (questionId: string, category: Category, correct: boolean) => {
        const state = get();
        const progress = { ...state.categoryProgress };
        const catProgress = { ...progress[category] };

        catProgress.totalAnswered += 1;
        if (correct) {
          catProgress.correctAnswered += 1;
        }
        if (!catProgress.answeredIds.includes(questionId)) {
          catProgress.answeredIds = [...catProgress.answeredIds, questionId];
        }

        progress[category] = catProgress;

        // 오답 노트 처리
        let wrongNotes = [...state.wrongNotes];
        if (!correct) {
          // 이미 오답 노트에 있으면 날짜 갱신, 없으면 추가
          const existingIndex = wrongNotes.findIndex(n => n.questionId === questionId);
          const today = getTodayKST();
          if (existingIndex >= 0) {
            wrongNotes[existingIndex] = {
              ...wrongNotes[existingIndex],
              wrongDate: today,
            };
          } else {
            wrongNotes.push({
              questionId,
              category,
              wrongDate: today,
            });
          }
        } else {
          // 정답을 맞히면 오답 노트에서 제거
          wrongNotes = wrongNotes.filter(n => n.questionId !== questionId);
        }

        // 칭호 해금 체크
        const unlockedTitles = [...state.unlockedTitles];
        const newTitle = checkTitleUnlock(progress, unlockedTitles);
        if (newTitle) {
          unlockedTitles.push(newTitle);
        }

        set({
          categoryProgress: progress,
          wrongNotes,
          unlockedTitles,
        });
      },

      removeWrongNote: (questionId: string) => {
        const state = get();
        set({
          wrongNotes: state.wrongNotes.filter(n => n.questionId !== questionId),
        });
      },

      updateWrongNoteDate: (questionId: string) => {
        const state = get();
        const today = getTodayKST();
        set({
          wrongNotes: state.wrongNotes.map(n =>
            n.questionId === questionId ? { ...n, wrongDate: today } : n
          ),
        });
      },

      completeDailyChallenge: () => {
        set({ dailyChallengeCompleted: true });
      },

      equipTitle: (titleId: string) => {
        const state = get();
        if (state.unlockedTitles.includes(titleId)) {
          set({ equippedTitle: titleId });
        }
      },

      updateNickname: (name: string) => {
        set({ nickname: name });
      },

      updateMbtiType: (type: string) => {
        set({ mbtiType: type });
      },

      checkDailyReset: () => {
        const state = get();
        const updates = checkAndResetDaily(state);
        if (updates) {
          set(updates);
        }
      },

      ensureUserId: () => {
        if (!get().userId) {
          set({ userId: generateUserId() });
        }
      },
    }),
    {
      name: 'quiz-master-storage',
    }
  )
);
