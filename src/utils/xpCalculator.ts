export interface XPResult {
  base: number;
  timeBonus: number;
  perfectBonus: number;
  total: number;
}

/**
 * XP 계산
 * @param correct 맞힌 문제 수
 * @param totalTime 문제별 소요 시간 배열 (초 단위)
 * @param total 총 문제 수
 */
export function calculateXP(
  correct: number,
  totalTime: number[],
  total: number
): XPResult {
  const base = correct * 10;

  const timeBonus = totalTime.reduce((acc, time, index) => {
    // 시간 보너스는 정답인 경우에만 적용하지 않고, 빠른 답변 자체에 보상
    // 5초 미만으로 답한 문제당 +3 XP
    if (time < 5) {
      return acc + 3;
    }
    return acc;
  }, 0);

  const perfectBonus = correct === total && total > 0 ? 100 : 0;

  return {
    base,
    timeBonus,
    perfectBonus,
    total: base + timeBonus + perfectBonus,
  };
}
