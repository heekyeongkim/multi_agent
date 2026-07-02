export type ActionType = 'read' | 'write' | 'run' | 'rest';

interface ActionMeta {
  toolName: string | null;
  emoji: string;
  verb: string;
}

const ACTION_META: Record<ActionType, ActionMeta> = {
  read: { toolName: 'Read', emoji: '📖', verb: '살펴보고 있어요' },
  write: { toolName: 'Edit', emoji: '✏️', verb: '수정하는 중이에요' },
  run: { toolName: 'Bash', emoji: '⚙️', verb: '명령을 실행하고 있어요' },
  rest: { toolName: null, emoji: '☕', verb: '잠깐 쉬는 중이에요' },
};

export function getToolName(action: ActionType): string | null {
  return ACTION_META[action].toolName;
}

export function buildLogMessage(action: ActionType, target: string, reason: string): string {
  const { emoji, verb } = ACTION_META[action];
  const targetPart = target ? `${target} ` : '';
  return `${emoji} ${targetPart}${verb} — ${reason}`;
}

export function buildToolInput(action: ActionType, target: string): Record<string, unknown> {
  switch (action) {
    case 'read':
      return { file_path: target || 'README.md' };
    case 'write':
      return { file_path: target || 'output.ts', new_string: '', old_string: '' };
    case 'run':
      return { command: target || 'ls' };
    default:
      return {};
  }
}

export function parseResponse(raw: string): { action: ActionType; target: string; reason: string } {
  try {
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      const action = typeof parsed.action === 'string' ? parsed.action.toLowerCase() : '';
      const validAction = (['read', 'write', 'run', 'rest'] as const).includes(action as ActionType)
        ? (action as ActionType)
        : 'rest';
      return {
        action: validAction,
        target: typeof parsed.target === 'string' ? parsed.target : '',
        reason: typeof parsed.reason === 'string' ? parsed.reason : '작업 중',
      };
    }
  } catch {
    // fall through
  }
  return { action: 'rest', target: '', reason: '잠깐 쉬는 중' };
}
