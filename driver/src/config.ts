export interface AgentConfig {
  name: string;
  model: string;
}

export const AGENTS: AgentConfig[] = [
  { name: '김대리', model: 'meta-llama/llama-3.2-3b-instruct:free' },
  { name: '박사원', model: 'google/gemma-4-26b-a4b-it:free' },
  { name: '이주임', model: 'qwen/qwen3-coder:free' },
];

/** 행동 지속 시간 (ms) — 애니메이션이 보이는 시간 */
export const ACTION_DURATION_MS = 5000;

/** 행동 사이 대기 시간 (ms) */
export const LOOP_DELAY_MS = 2000;

/** 세션 시작 후 스캐너가 채택할 때까지 대기 (ms) — 프로젝트 스캐너 주기 1s 기준 */
export const SCANNER_WARMUP_MS = 2500;

/** 에이전트 순차 시작 간격 (ms) */
export const AGENT_STAGGER_MS = 1500;
