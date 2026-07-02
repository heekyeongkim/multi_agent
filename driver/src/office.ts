import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ServerJson {
  port: number;
  pid: number;
  token: string;
}

function normalizeProjectPath(absPath: string): string {
  return absPath.replace(/[^a-zA-Z0-9-]/g, '-');
}

export function readServerJson(): ServerJson {
  const serverJsonPath = path.join(os.homedir(), '.pixel-agents', 'server.json');
  const raw = fs.readFileSync(serverJsonPath, 'utf8');
  return JSON.parse(raw) as ServerJson;
}

/**
 * 세션 JSONL 파일을 생성한다.
 * 외부 세션 채택 스캐너가 이 파일을 발견해 캐릭터를 생성한다.
 * mock-claude와 동일한 경로 규칙 사용:
 *   ~/.claude/projects/<normalized-workspace>/<session-id>.jsonl
 */
export function createSessionJsonl(sessionId: string, cwd: string): string {
  const projectDirName = normalizeProjectPath(cwd);
  const projectDir = path.join(os.homedir(), '.claude', 'projects', projectDirName);
  fs.mkdirSync(projectDir, { recursive: true });

  const transcriptPath = path.join(projectDir, `${sessionId}.jsonl`);

  // 최소 초기 레코드 — 파일이 존재해야 스캐너가 채택함
  const initRecord = {
    type: 'system',
    subtype: 'init',
    session_id: sessionId,
    cwd,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(transcriptPath, JSON.stringify(initRecord) + '\n');

  return transcriptPath;
}

export function appendToJsonl(transcriptPath: string, record: Record<string, unknown>): void {
  fs.appendFileSync(transcriptPath, JSON.stringify(record) + '\n');
}

export async function postHook(
  server: ServerJson,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = `http://127.0.0.1:${server.port}/api/hooks/claude`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${server.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`훅 POST 실패 (${response.status}): ${text.slice(0, 200)}`);
  }
}
