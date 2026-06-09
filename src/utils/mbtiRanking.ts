import type { Category } from '../types';

export interface MbtiStat {
  avgAccuracy: number;
  avgXP: number;
  strongCategory: Category;
  weakCategory: Category;
  categoryAvg: Record<Category, number>;
}

export type MbtiStatsMap = Record<string, MbtiStat>;

/**
 * 사용자 XP를 MBTI 유형 평균 XP와 비교하여 백분위(0~100) 추정.
 */
export function calculatePercentile(
  userXP: number,
  mbtiType: string,
  mbtiStats: MbtiStatsMap
): number {
  const stats = mbtiStats[mbtiType];
  if (!stats) {
    return 50;
  }

  const mean = stats.avgXP;
  const stdDev = mean * 0.4; // 표준편차 = 평균의 40%

  const zScore = (userXP - mean) / stdDev;

  const percentile = normalCDF(zScore) * 100;

  return Math.round(Math.min(Math.max(percentile, 0), 100));
}

/**
 * 표준정규분포 CDF 근사
 */
function normalCDF(z: number): number {
  if (z < -6) return 0;
  if (z > 6) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);

  return 0.5 * (1.0 + sign * y);
}

/**
 * 모든 MBTI 유형을 평균 XP 기준 내림차순 정렬
 */
export function getMbtiRanking(
  mbtiStats: MbtiStatsMap
): Array<{ type: string; avgXP: number; avgAccuracy: number }> {
  return Object.entries(mbtiStats)
    .map(([type, stat]) => ({
      type,
      avgXP: stat.avgXP,
      avgAccuracy: stat.avgAccuracy,
    }))
    .sort((a, b) => b.avgXP - a.avgXP);
}
