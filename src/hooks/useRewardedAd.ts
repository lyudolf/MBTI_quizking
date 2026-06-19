import { useState, useRef, useCallback } from 'react';
import { showRewardedAd } from '../lib/ads';

interface RequestOpts {
  /** 광고를 끝까지 시청했을 때 호출 (보상 지급) */
  onReward: () => void;
  /** 안내 메시지 표시 (실패/미시청 등) */
  onMessage?: (msg: string) => void;
}

/**
 * 리워드 광고 요청 훅.
 * - loading: 광고 로딩/노출 중 (버튼 비활성화용)
 * - requestReward: 광고를 띄우고, 시청 완료 시에만 onReward 실행
 *   토스 앱 밖(개발/웹)에서는 미지원이라, DEV 모드 한정으로 테스트 편의상 즉시 지급
 */
export function useRewardedAd() {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const requestReward = useCallback(async ({ onReward, onMessage }: RequestOpts) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const { rewarded } = await showRewardedAd();
      if (rewarded) onReward();
      else onMessage?.('광고를 끝까지 시청해야 보상을 받을 수 있어요.');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'UNSUPPORTED') {
        if (import.meta.env.DEV) {
          onReward(); // 개발 환경(토스 앱 밖) 테스트용 즉시 지급
        } else {
          onMessage?.('지금은 광고를 불러올 수 없어요. 잠시 후 다시 시도해주세요.');
        }
      } else {
        onMessage?.('광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { requestReward, loading };
}
