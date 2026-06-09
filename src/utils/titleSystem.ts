import type { Category, CategoryProgress, Title } from '../types';
import titlesData from '../data/titles.json';

const TITLES_REQUIRED_CORRECT = 300;

const titles: Title[] = titlesData as Title[];

/**
 * 카테고리 진행 상황을 확인하여 새로 해금된 칭호 ID를 반환.
 * 이미 해금된 칭호는 제외.
 * 새로 해금된 칭호가 없으면 null 반환.
 */
export function checkTitleUnlock(
  categoryProgress: Record<Category, CategoryProgress>,
  unlockedTitles: string[]
): string | null {
  for (const title of titles) {
    if (unlockedTitles.includes(title.id)) {
      continue;
    }

    const progress = categoryProgress[title.category];
    if (progress && progress.correctAnswered >= TITLES_REQUIRED_CORRECT) {
      return title.id;
    }
  }

  return null;
}

/**
 * 카테고리에 대응하는 칭호 반환
 */
export function getTitleForCategory(category: Category): Title {
  const title = titles.find(t => t.category === category);
  if (!title) {
    throw new Error(`Title not found for category: ${category}`);
  }
  return title;
}

/**
 * 칭호 ID로 칭호 정보 조회
 */
export function getTitleById(titleId: string): Title | undefined {
  return titles.find(t => t.id === titleId);
}

/**
 * 전체 칭호 목록 반환
 */
export function getAllTitles(): Title[] {
  return [...titles];
}
