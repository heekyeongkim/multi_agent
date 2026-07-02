import { AGENTS, AGENT_STAGGER_MS } from './config.js';
import { runAgent } from './agent.js';
import { info, logError } from './logger.js';
import { readServerJson } from './office.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    logError('OPENROUTER_API_KEY 환경변수가 필요합니다.');
    logError('사용법: OPENROUTER_API_KEY=sk-or-... npx tsx driver/src/index.ts');
    process.exit(1);
  }

  // 서버 연결 확인
  try {
    const server = readServerJson();
    info(`픽셀 에이전트 서버 발견 — 포트 ${server.port}`);
  } catch {
    logError('~/.pixel-agents/server.json 을 읽을 수 없습니다.');
    logError('먼저 "npx pixel-agents" 로 서버를 실행하세요.');
    process.exit(1);
  }

  const cwd = process.cwd();
  info(`워크스페이스: ${cwd}`);
  info(`에이전트 ${AGENTS.length}명을 순차 시작합니다 (${AGENT_STAGGER_MS}ms 간격)…`);
  info('');

  // 각 에이전트를 AGENT_STAGGER_MS 간격으로 시작 (스캐너 채택 레이스 방지)
  const promises: Promise<void>[] = [];
  for (let i = 0; i < AGENTS.length; i++) {
    const cfg = AGENTS[i];
    const delay = i * AGENT_STAGGER_MS;
    promises.push(sleep(delay).then(() => runAgent(cfg, apiKey, cwd)));
  }

  await Promise.all(promises);
}

main().catch((err) => {
  logError(`치명적 오류: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
