export type ReasoningTagMode = "strict" | "preserve";
export type ReasoningTagTrim = "none" | "start" | "both";

const QUICK_TAG_RE = /<\s*\/?\s*(?:think(?:ing)?|thought|antthinking|final)\b/i;
const FINAL_TAG_RE = /<\s*\/?\s*final\b[^<>]*>/gi;
const THINKING_TAG_RE = /<\s*(\/?)\s*(?:think(?:ing)?|thought|antthinking)\b[^<>]*>/gi;

interface CodeRegion {
  start: number;
  end: number;
}

function findCodeRegions(text: string): CodeRegion[] {
  const regions: CodeRegion[] = [];
  const FENCED_RE = /^ {0,3}(`{3,}|~{3,})([\s\S]*?)^ {0,3}\1/gm;
  const INLINE_RE = /(`+)([\s\S]*?)\1/g;

  let match: RegExpExecArray | null;

  // Find fenced blocks first
  while ((match = FENCED_RE.exec(text)) !== null) {
    regions.push({ start: match.index, end: FENCED_RE.lastIndex });
  }

  // Find inline code, skipping positions inside fenced blocks
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    const start = match.index;
    const end = INLINE_RE.lastIndex;
    if (!regions.some((r) => start >= r.start && start < r.end)) {
      regions.push({ start, end });
    }
  }

  return regions.sort((a, b) => a.start - b.start);
}

function isInsideCode(pos: number, regions: CodeRegion[]): boolean {
  return regions.some((r) => pos >= r.start && pos < r.end);
}

function applyTrim(value: string, mode: ReasoningTagTrim): string {
  if (mode === "none") return value;
  if (mode === "start") return value.trimStart();
  return value.trim();
}

export function stripReasoningTagsFromText(
  text: string,
  options?: {
    mode?: ReasoningTagMode;
    trim?: ReasoningTagTrim;
  },
): string {
  if (!text) return text;
  if (!QUICK_TAG_RE.test(text)) return text;

  const mode = options?.mode ?? "strict";
  const trimMode = options?.trim ?? "both";

  const codeRegions = findCodeRegions(text);

  let cleaned = text;
  if (FINAL_TAG_RE.test(cleaned)) {
    FINAL_TAG_RE.lastIndex = 0;
    let finalResult = "";
    let finalLastIndex = 0;
    for (const match of cleaned.matchAll(FINAL_TAG_RE)) {
      const idx = match.index ?? 0;
      if (isInsideCode(idx, codeRegions)) continue;
      finalResult += cleaned.slice(finalLastIndex, idx);
      finalLastIndex = idx + match[0].length;
    }
    finalResult += cleaned.slice(finalLastIndex);
    cleaned = finalResult;
  } else {
    FINAL_TAG_RE.lastIndex = 0;
  }

  THINKING_TAG_RE.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  let inThinking = false;

  for (const match of cleaned.matchAll(THINKING_TAG_RE)) {
    const idx = match.index ?? 0;
    const isClose = match[1] === "/";

    if (isInsideCode(idx, codeRegions)) continue;

    if (!inThinking) {
      result += cleaned.slice(lastIndex, idx);
      if (!isClose) {
        inThinking = true;
      }
    } else if (isClose) {
      inThinking = false;
    }

    lastIndex = idx + match[0].length;
  }

  if (!inThinking || mode === "preserve") {
    result += cleaned.slice(lastIndex);
  }

  return applyTrim(result, trimMode);
}