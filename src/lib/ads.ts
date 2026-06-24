import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

// 운영 광고 그룹 ID는 env로 주입. 없으면 토스 공식 "보상형 테스트 ID" 사용.
// ⚠️ 개발 중엔 반드시 테스트 ID. 운영 ID를 테스트에 쓰면 제재 대상.
const TEST_REWARDED = 'ait-ad-test-rewarded-id';

/** 광고 그룹 ID — 보상 종류별로 분리(리포트 분석용). 미설정 시 테스트 ID. */
export const AD_GROUP = {
  ticket: import.meta.env.VITE_AD_GROUP_ID_TICKET || TEST_REWARDED,
  xp: import.meta.env.VITE_AD_GROUP_ID_XP || TEST_REWARDED,
};

// SDK 이벤트를 느슨하게 받기 위한 최소 타입 (정확한 union에 결합하지 않음)
type AdEvent = { type: string; data?: { unitType?: string; unitAmount?: number } };

/** 토스 앱(웹뷰) 환경에서 리워드 광고가 지원되는지 */
export function isRewardedAdSupported(): boolean {
  try {
    return Boolean(loadFullScreenAd.isSupported?.() && showFullScreenAd.isSupported?.());
  } catch {
    return false;
  }
}

/**
 * 리워드 전면광고를 로드 → 노출하고, 시청 완료 여부를 반환.
 * - rewarded === true 는 `userEarnedReward` 이벤트가 발생했을 때만 (끝까지 시청)
 * - 미지원 환경이면 Error('UNSUPPORTED') 로 reject
 */
export function showRewardedAd(adGroupId: string): Promise<{ rewarded: boolean }> {
  return new Promise((resolve, reject) => {
    if (!isRewardedAdSupported()) {
      reject(new Error('UNSUPPORTED'));
      return;
    }

    let cleanupLoad: () => void = () => {};
    let cleanupShow: () => void = () => {};
    let rewarded = false;
    let settled = false;

    const finish = (result?: { rewarded: boolean }, err?: Error) => {
      if (settled) return;
      settled = true;
      try { cleanupLoad(); } catch { /* noop */ }
      try { cleanupShow(); } catch { /* noop */ }
      if (err) reject(err);
      else resolve(result ?? { rewarded });
    };

    try {
      cleanupLoad = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event: AdEvent) => {
          if (event.type === 'loaded') {
            cleanupShow = showFullScreenAd({
              options: { adGroupId },
              onEvent: (e: AdEvent) => {
                if (e.type === 'userEarnedReward') rewarded = true;
                else if (e.type === 'dismissed') finish({ rewarded });
                else if (e.type === 'failedToShow') finish(undefined, new Error('FAILED_TO_SHOW'));
              },
              onError: (err: Error) => finish(undefined, err),
            });
          }
        },
        onError: (err: Error) => finish(undefined, err),
      });
    } catch (err) {
      finish(undefined, err as Error);
    }
  });
}

// ── 프리로드 (미리 로드해 두고, 누르면 즉시 노출) ──────────────
type PreloadState = { ready: boolean; cleanup: () => void };
const preloads = new Map<string, PreloadState>();

/** 광고를 미리 로드해둠 (화면 진입 시 호출) */
export function preloadAd(adGroupId: string): void {
  if (!isRewardedAdSupported()) return;
  const existing = preloads.get(adGroupId);
  if (existing?.ready) return; // 이미 준비됨
  if (existing) { try { existing.cleanup(); } catch { /* noop */ } }
  const state: PreloadState = { ready: false, cleanup: () => {} };
  preloads.set(adGroupId, state);
  try {
    state.cleanup = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (e: AdEvent) => { if (e.type === 'loaded') state.ready = true; },
      onError: () => { state.ready = false; },
    });
  } catch {
    state.ready = false;
  }
}

export function isAdReady(adGroupId: string): boolean {
  return preloads.get(adGroupId)?.ready ?? false;
}

export function cancelPreload(adGroupId: string): void {
  const st = preloads.get(adGroupId);
  if (st) {
    try { st.cleanup(); } catch { /* noop */ }
    preloads.delete(adGroupId);
  }
}

/** 이미 프리로드된 광고를 즉시 노출 */
export function showPreloadedAd(adGroupId: string): Promise<{ rewarded: boolean }> {
  return new Promise((resolve, reject) => {
    if (!isRewardedAdSupported()) {
      reject(new Error('UNSUPPORTED'));
      return;
    }
    let rewarded = false;
    let settled = false;
    let cleanupShow: () => void = () => {};
    const finish = (result?: { rewarded: boolean }, err?: Error) => {
      if (settled) return;
      settled = true;
      try { cleanupShow(); } catch { /* noop */ }
      cancelPreload(adGroupId); // 사용한 프리로드 비움
      if (err) reject(err);
      else resolve(result ?? { rewarded });
    };
    try {
      cleanupShow = showFullScreenAd({
        options: { adGroupId },
        onEvent: (e: AdEvent) => {
          if (e.type === 'userEarnedReward') rewarded = true;
          else if (e.type === 'dismissed') finish({ rewarded });
          else if (e.type === 'failedToShow') finish(undefined, new Error('FAILED_TO_SHOW'));
        },
        onError: (err: Error) => finish(undefined, err),
      });
    } catch (err) {
      finish(undefined, err as Error);
    }
  });
}
