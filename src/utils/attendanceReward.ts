// 출석 보상 — 누적 출석일 기준 7일 주기 달력 (하루 빠져도 안 끊김)
// 2일째부터 유의미한 보상 (D1→D2 리텐션 핵심)

export interface AttendanceReward {
  tickets: number;
  xp: number;
}

const CALENDAR: AttendanceReward[] = [
  { tickets: 1, xp: 0 },   // 1일째
  { tickets: 3, xp: 0 },   // 2일째 (핵심)
  { tickets: 3, xp: 0 },   // 3일째
  { tickets: 0, xp: 200 }, // 4일째
  { tickets: 4, xp: 0 },   // 5일째
  { tickets: 0, xp: 300 }, // 6일째
  { tickets: 5, xp: 500 }, // 7일째 (1주 완성)
];

export const ATTENDANCE_CYCLE = CALENDAR.length; // 7

function idx(day: number): number {
  return (((day - 1) % ATTENDANCE_CYCLE) + ATTENDANCE_CYCLE) % ATTENDANCE_CYCLE;
}

/** 누적 출석 N일째에 받는 보상 */
export function rewardForDay(day: number): AttendanceReward {
  return CALENDAR[idx(day)];
}

/** 이번 주기에서 몇 번째 칸인지 (1~7) */
export function cyclePosition(day: number): number {
  return idx(day) + 1;
}

/** 달력 표시용 — 1~7번째 칸의 보상 목록 */
export function calendarRewards(): AttendanceReward[] {
  return CALENDAR.slice();
}

/** 보상 한 줄 표기 (예: "🎟️3", "⭐200") */
export function rewardText(r: AttendanceReward): string {
  const parts: string[] = [];
  if (r.tickets > 0) parts.push(`🎟️ ${r.tickets}장`);
  if (r.xp > 0) parts.push(`⭐ ${r.xp} XP`);
  return parts.join(' + ') || '-';
}
