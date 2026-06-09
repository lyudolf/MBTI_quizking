import { useGameStore } from '../store/useGameStore';

const DAILY_FREE_TICKETS = 3;
const MAX_AD_TICKETS = 3;

/**
 * 티켓 관련 유틸리티 훅
 */
export function useTicket() {
  const tickets = useGameStore(state => state.tickets);
  const dailyAdTicketsUsed = useGameStore(state => state.dailyAdTicketsUsed);

  /**
   * 티켓 사용 가능 여부
   */
  const canUseTicket = (): boolean => {
    return tickets > 0;
  };

  /**
   * 광고 시청으로 티켓 획득 가능 여부
   */
  const canWatchAd = (): boolean => {
    return dailyAdTicketsUsed < MAX_AD_TICKETS;
  };

  /**
   * 남은 광고 티켓 슬롯 수
   */
  const getRemainingAdSlots = (): number => {
    return Math.max(0, MAX_AD_TICKETS - dailyAdTicketsUsed);
  };

  return {
    tickets,
    dailyAdTicketsUsed,
    DAILY_FREE_TICKETS,
    MAX_AD_TICKETS,
    canUseTicket,
    canWatchAd,
    getRemainingAdSlots,
  };
}
