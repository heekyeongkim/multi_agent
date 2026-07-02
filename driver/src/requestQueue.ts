/**
 * 글로벌 LLM 요청 직렬기
 * 무료 티어 레이트리밋 대응 — 동시 호출 1개, 호출 간 최소 간격 유지
 */

const MIN_INTERVAL_MS = 4000; // 호출 사이 최소 4초

let lastCallTime = 0;
let queue: (() => void)[] = [];
let processing = false;

function processQueue(): void {
  if (processing || queue.length === 0) return;
  processing = true;

  const next = queue.shift()!;
  const now = Date.now();
  const wait = Math.max(0, lastCallTime + MIN_INTERVAL_MS - now);

  setTimeout(() => {
    lastCallTime = Date.now();
    next();
    processing = false;
    processQueue();
  }, wait);
}

/** LLM 호출 전에 이 함수로 토큰을 획득한다. */
export function acquireLLMSlot(): Promise<void> {
  return new Promise((resolve) => {
    queue.push(resolve);
    processQueue();
  });
}
