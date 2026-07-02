import { acquireLLMSlot } from './requestQueue.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const SYSTEM_PROMPT = `당신은 한국 IT 회사의 사무실 직원입니다.
매 턴마다 지금 할 작업을 결정하세요.

반드시 아래 JSON만 출력하세요 (다른 텍스트 없이):
{"action": "read"|"write"|"run"|"rest", "target": "파일명 또는 명령어", "reason": "한국어 이유 한 줄"}

행동 설명:
- read: 파일을 읽거나 검토 (target = 파일명)
- write: 파일을 작성하거나 수정 (target = 파일명)
- run: 명령어 실행 (target = 명령어)
- rest: 휴식 (target = 빈 문자열)

예시: {"action":"read","target":"package.json","reason":"의존성 목록을 확인하려고"}`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

export async function callLLM(
  apiKey: string,
  model: string,
  agentName: string,
  history: string[],
): Promise<string> {
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Inject recent history so the agent varies its actions
  for (let i = 0; i < history.length; i++) {
    messages.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: history[i] });
  }

  messages.push({
    role: 'user',
    content: `${agentName}로서 지금 무슨 작업을 할지 JSON으로 답하세요.`,
  });

  // 글로벌 직렬 대기 — 무료 티어 레이트리밋 방지
  await acquireLLMSlot();

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/pixel-agents-hq/pixel-agents',
      'X-Title': 'Pixel Agents Driver',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 120,
      temperature: 0.9,
    }),
  });

  if (response.status === 429) {
    // 레이트리밋 — 잠깐 대기 후 호출자가 재시도
    throw new Error(`RATE_LIMITED`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error) {
    throw new Error(`OpenRouter API 오류: ${data.error.message}`);
  }

  return (
    data.choices[0]?.message?.content ?? '{"action":"rest","target":"","reason":"잠깐 쉬는 중"}'
  );
}
