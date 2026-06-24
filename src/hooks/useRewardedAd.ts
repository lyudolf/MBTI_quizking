import { useState, useRef, useEffect, useCallback } from 'react';
import { showRewardedAd, showPreloadedAd, preloadAd, isAdReady, cancelPreload } from '../lib/ads';

interface RequestOpts {
  /** 광고를 끝까지 시청했을 때 호출 (보상 지급) */
  onReward: () => void;
  /** 안내 메시지 표시 (실패/미시청 등) */
  onMessage?: (msg: string) => void;
}

/**
 * 리워드 광고 요청 훅 (프리로드).
 * - 화면 진입 시 `adGroupId` 광고를 미리 로드 → 버튼 누르면 즉시 노출
 * - 아직 로드 전이면 그 자리에서 로드+노출(폴백)
 * - 토스 앱 밖(개발/웹)에선 미지원이라, DEV 모드 한정 즉시 지급
 */
export function useRewardedAd(adGroupId: string) {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  // 화면 진입 시 미리 로드
  useEffect(() => {
    preloadAd(adGroupId);
  }, [adGroupId]);

  const requestReward = useCallback(
    async ({ onReward, onMessage }: RequestOpts) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      try {
        const result = isAdReady(adGroupId)
          ? await showPreloadedAd(adGroupId) // 즉시 노출
          : (cancelPreload(adGroupId), await showRewardedAd(adGroupId)); // 폴백: 로드+노출
        if (result.rewarded) onReward();
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
        preloadAd(adGroupId); // 다음 광고 미리 로드
      }
    },
    [adGroupId]
  );

  return { requestReward, loading };
}
