import { randomUUID } from 'crypto';
import type { AgentConfig } from './config.js';
import { ACTION_DURATION_MS, LOOP_DELAY_MS, SCANNER_WARMUP_MS } from './config.js';
import { parseResponse, buildLogMessage, buildToolInput, getToolName } from './actions.js';
import { callLLM } from './openrouter.js';
import { demoAction } from './demoFallback.js';
import { createSessionJsonl, appendToJsonl, postHook, readServerJson } from './office.js';
import { log, warn, info } from './logger.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAgent(cfg: AgentConfig, apiKey: string, cwd: string): Promise<void> {
  const sessionId = randomUUID();

  log(cfg.name, `🚀 세션 시작 (${sessionId.slice(0, 8)}…)`);

  const transcriptPath = createSessionJsonl(sessionId, cwd);
  await sleep(SCANNER_WARMUP_MS);

  // SessionStart 훅 — 재시도 포함
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const server = readServerJson();
      await postHook(server, {
        hook_event_name: 'SessionStart',
        session_id: sessionId,
        transcript_path: transcriptPath,
        cwd,
        source: 'driver',
      });
      log(cfg.name, `✅ 오피스 입장 완료`);
      break;
    } catch {
      warn(`[${cfg.name}] 서버 연결 대기 중… (${attempt + 1}/5)`);
      await sleep(2000);
    }
  }

  const history: string[] = [];
  let rateLimitBackoff = 3000;
  let consecutiveRateLimits = 0;
  const DEMO_FALLBACK_THRESHOLD = 3;

  while (true) {
    try {
      const server = readServerJson();
      let action: string, target: string, reason: string;

      // 레이트리밋이 반복되면 데모 폴백 사용
      if (consecutiveRateLimits >= DEMO_FALLBACK_THRESHOLD) {
        const demo = demoAction();
        action = demo.action;
        target = demo.target;
        reason = demo.reason;
        if (consecutiveRateLimits === DEMO_FALLBACK_THRESHOLD) {
          info(`[${cfg.name}] 레이트리밋 지속 → 데모 모드 전환 (LLM 복구 시 자동 복원)`);
        }
      } else {
        const rawResponse = await callLLM(apiKey, cfg.model, cfg.name, history);
        consecutiveRateLimits = 0;
        rateLimitBackoff = 3000;
        const parsed = parseResponse(rawResponse);
        action = parsed.action;
        target = parsed.target;
        reason = parsed.reason;
        history.push(`이전: ${action} ${target}`);
        history.push(rawResponse.slice(0, 80));
        if (history.length > 6) history.splice(0, 2);
      }

      const toolName = getToolName(action as Parameters<typeof getToolName>[0]);
      const logMsg = buildLogMessage(
        action as Parameters<typeof buildLogMessage>[0],
        target,
        reason,
      );

      if (action === 'rest' || toolName === null) {
        log(cfg.name, logMsg);
        try {
          await postHook(server, { hook_event_name: 'Stop', session_id: sessionId });
        } catch {
          /* 무시 */
        }
        appendToJsonl(transcriptPath, {
          type: 'system',
          subtype: 'turn_duration',
          session_id: sessionId,
          duration_ms: ACTION_DURATION_MS,
          timestamp: new Date().toISOString(),
        });
        await sleep(LOOP_DELAY_MS + ACTION_DURATION_MS);
      } else {
        const toolInput = buildToolInput(action as Parameters<typeof buildToolInput>[0], target);
        try {
          await postHook(server, {
            hook_event_name: 'PreToolUse',
            session_id: sessionId,
            tool_name: toolName,
            tool_input: toolInput,
          });
        } catch {
          /* 무시 */
        }
        log(cfg.name, logMsg);
        await sleep(ACTION_DURATION_MS);
        try {
          await postHook(server, {
            hook_event_name: 'PostToolUse',
            session_id: sessionId,
            tool_name: toolName,
          });
        } catch {
          /* 무시 */
        }
        await sleep(LOOP_DELAY_MS);
      }

      // 데모 모드 중에도 주기적으로 LLM 재시도 (10번 행동마다)
      if (consecutiveRateLimits >= DEMO_FALLBACK_THRESHOLD) {
        consecutiveRateLimits++;
        if (consecutiveRateLimits % 10 === 0) {
          consecutiveRateLimits = 0;
          info(`[${cfg.name}] LLM 재연결 시도 중…`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'RATE_LIMITED') {
        consecutiveRateLimits++;
        info(
          `[${cfg.name}] 레이트리밋 — ${rateLimitBackoff / 1000}초 대기 (${consecutiveRateLimits}회 연속)`,
        );
        await sleep(rateLimitBackoff);
        rateLimitBackoff = Math.min(rateLimitBackoff * 2, 30_000);
      } else {
        consecutiveRateLimits = 0;
        warn(`[${cfg.name}] 오류, 재시도 — ${msg.slice(0, 100)}`);
        await sleep(LOOP_DELAY_MS * 2);
      }
    }
  }
}
