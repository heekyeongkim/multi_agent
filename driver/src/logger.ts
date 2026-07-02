const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[90m';

const PALETTE = [
  '\x1b[36m', // 청록
  '\x1b[35m', // 보라
  '\x1b[33m', // 노랑
  '\x1b[34m', // 파랑
  '\x1b[32m', // 초록
  '\x1b[31m', // 빨강
];

const nameColors = new Map<string, string>();
let colorIndex = 0;

function colorOf(name: string): string {
  if (!nameColors.has(name)) {
    nameColors.set(name, PALETTE[colorIndex % PALETTE.length]);
    colorIndex++;
  }
  return nameColors.get(name)!;
}

function timestamp(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour12: false });
}

export function log(name: string, message: string): void {
  const c = colorOf(name);
  console.log(`${c}${BOLD}[${name}]${RESET} ${c}${message}${RESET} ${DIM}${timestamp()}${RESET}`);
}

export function info(message: string): void {
  console.log(`${DIM}▶ ${message}${RESET}`);
}

export function warn(message: string): void {
  console.warn(`\x1b[33m⚠ ${message}${RESET}`);
}

export function logError(message: string): void {
  console.error(`\x1b[31m✗ ${message}${RESET}`);
}
