import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getTodayKST } from '../utils/dailyReset';
import type { Category, WrongNote } from '../types';

/**
 * 오답 노트 관리 훅
 *
 * wrongDate < today → 복습 가능 (다음 날부터 복습 가능)
 * wrongDate >= today → 대기 중 (오늘 틀린 문제는 내일부터 복습)
 */
export function useWrongNote() {
  const wrongNotes = useGameStore(state => state.wrongNotes);

  const today = useMemo(() => getTodayKST(), []);

  /**
   * 복습 가능한 오답 노트 (wrongDate < today)
   */
  const getAvailableNotes = (): WrongNote[] => {
    return wrongNotes.filter(note => note.wrongDate < today);
  };

  /**
   * 대기 중인 오답 노트 (wrongDate >= today)
   */
  const getPendingNotes = (): WrongNote[] => {
    return wrongNotes.filter(note => note.wrongDate >= today);
  };

  /**
   * 카테고리별로 그룹화된 오답 노트
   */
  const getNotesGroupedByCategory = (): Record<Category, WrongNote[]> => {
    const grouped = {} as Record<Category, WrongNote[]>;

    for (const note of wrongNotes) {
      if (!grouped[note.category]) {
        grouped[note.category] = [];
      }
      grouped[note.category].push(note);
    }

    return grouped;
  };

  return {
    wrongNotes,
    totalCount: wrongNotes.length,
    availableCount: getAvailableNotes().length,
    getAvailableNotes,
    getPendingNotes,
    getNotesGroupedByCategory,
  };
}
