/**
 * Heading-level diff utilities for prompt section comparison.
 * Splits prompts by ## headings for granular section-by-section review.
 */

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

export interface SectionDiff {
  sectionIndex: number;
  oldContent: string;
  newContent: string;
  lines: DiffLine[];
  hasChanges: boolean;
  status: 'pending' | 'approved' | 'declined';
  hasSeparatorBefore: boolean;
}

const SECTION_SEPARATOR = '── ── ── ── ── ── ── ── ── ── ── ── ── ──';
const SEP_REGEX = /^── ── ── ── ── ── ── ── ── ── ── ── ── ──$/;

interface HeadingSection {
  content: string;
  hasSeparatorBefore: boolean;
}

/**
 * Split prompt by ## headings, tracking separator positions.
 */
export function splitByHeadings(prompt: string): HeadingSection[] {
  const lines = prompt.split('\n');
  const sections: HeadingSection[] = [];
  let current: string[] = [];
  let nextHasSep = false;
  let pendingSep = false;

  for (const line of lines) {
    if (SEP_REGEX.test(line.trim())) {
      pendingSep = true;
      continue;
    }

    if (/^##\s/.test(line) && current.length > 0) {
      const text = current.join('\n').trim();
      if (text) {
        sections.push({ content: text, hasSeparatorBefore: nextHasSep });
      }
      current = [line];
      nextHasSep = pendingSep;
      pendingSep = false;
    } else {
      if (current.length === 0 && pendingSep) {
        nextHasSep = true;
        pendingSep = false;
      }
      current.push(line);
    }
  }

  if (current.length > 0) {
    const text = current.join('\n').trim();
    if (text) {
      sections.push({ content: text, hasSeparatorBefore: nextHasSep || pendingSep });
    }
  }

  if (sections.length > 0) sections[0].hasSeparatorBefore = false;
  return sections;
}

/**
 * Join heading sections back, re-inserting separators where they originally existed.
 */
export function joinFromHeadingSections(sections: HeadingSection[]): string {
  return sections
    .filter(s => s.content.trim())
    .map((s, i) => {
      if (i === 0) return s.content;
      if (s.hasSeparatorBefore) return `\n${SECTION_SEPARATOR}\n\n${s.content}`;
      return s.content;
    })
    .join('\n\n');
}

// Keep legacy functions for backward compat with parseFullPromptToConfigs
export function splitSections(prompt: string): string[] {
  return prompt.split(/\n*── ── ── ── ── ── ── ── ── ── ── ── ── ──\n*/).map(p => p.trim()).filter(Boolean);
}

export function joinSections(sections: string[]): string {
  return sections.join(`\n\n${SECTION_SEPARATOR}\n\n`);
}

/**
 * Compute line-level diff between two texts using LCS.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');

  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const stack: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'unchanged', text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  stack.reverse();

  const result: DiffLine[] = [];
  for (const seg of stack) {
    const last = result[result.length - 1];
    if (last && last.type === seg.type) {
      last.text += '\n' + seg.text;
    } else {
      result.push({ ...seg });
    }
  }
  return result;
}

/**
 * Build section-level diffs between two full prompts using heading-based splitting.
 */
export function buildSectionDiffs(oldPrompt: string, newPrompt: string): SectionDiff[] {
  const oldSections = splitByHeadings(oldPrompt);
  const newSections = splitByHeadings(newPrompt);
  const maxLen = Math.max(oldSections.length, newSections.length);
  const diffs: SectionDiff[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oldContent = oldSections[i]?.content || '';
    const newContent = newSections[i]?.content || '';
    const hasChanges = oldContent !== newContent;
    const lines = hasChanges ? computeLineDiff(oldContent, newContent) : [{ type: 'unchanged' as const, text: oldContent }];
    const hasSeparatorBefore = newSections[i]?.hasSeparatorBefore ?? oldSections[i]?.hasSeparatorBefore ?? false;

    diffs.push({
      sectionIndex: i,
      oldContent,
      newContent,
      lines,
      hasChanges,
      status: hasChanges ? 'pending' : 'approved',
      hasSeparatorBefore,
    });
  }

  return diffs;
}

/**
 * Build the final prompt from section diffs based on approve/decline decisions.
 */
export function resolvePromptFromDiffs(diffs: SectionDiff[]): string {
  const sections: HeadingSection[] = [];
  for (const diff of diffs) {
    const content = diff.status === 'approved' ? diff.newContent : diff.oldContent;
    if (content.trim()) {
      sections.push({ content, hasSeparatorBefore: diff.hasSeparatorBefore });
    }
  }
  return joinFromHeadingSections(sections);
}
