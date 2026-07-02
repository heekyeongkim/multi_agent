/**
 * 레이트리밋 폴백 — 미리 정의된 행동 풀에서 랜덤 선택
 * 실제 LLM 호출이 계속 실패할 때 오피스 애니메이션을 유지한다
 */

import type { ActionType } from './actions.js';

interface DemoAction {
  action: ActionType;
  target: string;
  reason: string;
}

const ACTION_POOL: DemoAction[] = [
  { action: 'read', target: 'README.md', reason: '프로젝트 전체 구조를 파악하려고' },
  { action: 'read', target: 'package.json', reason: '의존성 목록을 확인하려고' },
  { action: 'write', target: 'notes.md', reason: '오늘 처리한 업무를 기록하려고' },
  { action: 'write', target: 'config.ts', reason: '설정 값을 업데이트하려고' },
  { action: 'run', target: 'npm test', reason: '변경 사항이 정상인지 확인하려고' },
  { action: 'run', target: 'git status', reason: '현재 변경 파일 목록을 보려고' },
  { action: 'read', target: 'src/index.ts', reason: '진입점 코드를 검토하려고' },
  { action: 'write', target: 'report.md', reason: '팀장에게 보고할 내용을 정리하려고' },
  { action: 'run', target: 'npm run lint', reason: '코드 스타일 문제가 없는지 확인하려고' },
  { action: 'read', target: 'CHANGELOG.md', reason: '최근 변경 사항을 파악하려고' },
  { action: 'rest', target: '', reason: '집중하느라 잠깐 스트레칭이 필요해서' },
  { action: 'read', target: 'server/src/types.ts', reason: '타입 정의를 다시 살펴보려고' },
  { action: 'write', target: 'TODO.md', reason: '남은 작업 목록을 정리하려고' },
  { action: 'run', target: 'git log --oneline', reason: '커밋 히스토리를 빠르게 확인하려고' },
  { action: 'rest', target: '', reason: '커피 한 잔 마시면서 생각을 정리하려고' },
];

let poolIndex = 0;

export function demoAction(): DemoAction {
  // 완전 랜덤 대신 순환 → 로그가 다양하게 보인다
  const action = ACTION_POOL[poolIndex % ACTION_POOL.length];
  poolIndex++;
  return action;
}
