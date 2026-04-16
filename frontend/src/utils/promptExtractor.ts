// Utility to extract only the actual prompt content from mixed AI responses
// Simplified to reliably capture the full prompt without truncation

export interface ExtractedPrompt {
  title: string;
  content: string;
}

function extractTitleFromContent(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (/^#{1,6}\s+/.test(l)) return l.replace(/^#+\s*/, '').trim();
  }
  const first = lines[0] || 'Generated Prompt';
  return first.length > 60 ? first.slice(0, 60) + '…' : first;
}

export function extractPromptContent(raw: string): ExtractedPrompt {
  const text = raw.trim();

  // Strategy 1: Look for explicit PROMPT_START/PROMPT_END markers
  const startMatch = text.match(/<!--\s*PROMPT_START\s*-->/i);
  const endMatch = text.match(/<!--\s*PROMPT_END\s*-->/i);
  
  if (startMatch && endMatch && startMatch.index !== undefined && endMatch.index !== undefined) {
    const start = startMatch.index + startMatch[0].length;
    const end = endMatch.index;
    if (end > start) {
      let content = text.slice(start, end).trim();
      // Remove code fences if present
      content = content.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```\s*$/, '').trim();
      if (content.length > 20) {
        return { title: extractTitleFromContent(content), content };
      }
    }
  }

  // Strategy 2: Find ALL code blocks and pick the best one
  const codeBlockRegex = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const blockContent = match[1].trim();
    if (blockContent.length > 20) {
      codeBlocks.push(blockContent);
    }
  }

  if (codeBlocks.length > 0) {
    // Score each block
    const scoredBlocks = codeBlocks.map(block => {
      let score = 0;
      
      // Prefer blocks with prompt-like keywords
      if (/(you are|act as|system\s*prompt|role\s*:|objective\s*:|task\s*:|# |## )/i.test(block)) {
        score += 10;
      }
      
      // Prefer longer blocks
      score += Math.min(block.length / 100, 20);
      
      // Prefer blocks with multiple lines
      const lineCount = block.split('\n').length;
      score += Math.min(lineCount, 10);
      
      // Prefer blocks with structured content (headings, bullets)
      if (/^#{1,6}\s+/m.test(block)) score += 5;
      if (/^[-*]\s+/m.test(block)) score += 3;
      
      return { block, score };
    });

    // Sort by score descending
    scoredBlocks.sort((a, b) => b.score - a.score);
    
    const bestBlock = scoredBlocks[0].block;
    return { title: extractTitleFromContent(bestBlock), content: bestBlock };
  }

  // Strategy 3: Look for content between headings that suggest "Final Prompt"
  const headingMatch = text.match(/^#{1,6}\s*(final|refined|system)?\s*prompt\b.*$/im);
  if (headingMatch && headingMatch.index !== undefined) {
    const startIdx = headingMatch.index;
    const tail = text.slice(startIdx);
    // Find next heading that looks like explanation
    const endHeadingMatch = tail.match(/\n#{1,6}\s*(rationale|explanation|notes|why|examples)\b/i);
    const endIdx = endHeadingMatch ? endHeadingMatch.index! : tail.length;
    let content = tail.slice(0, endIdx).trim();
    
    // Remove code fences if wrapped
    content = content.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```\s*$/, '').trim();
    
    if (content.length > 20) {
      return { title: extractTitleFromContent(content), content };
    }
  }

  // Strategy 4: Heuristic - skip obvious greetings and take substantial content
  const lines = text.split('\n');
  let startLine = 0;
  
  // Skip greeting lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^(hi|hello|hey|sure|absolutely|great|here(?:'|)s|i(?:'|)ve created)/i.test(line)) {
      continue;
    }
    // Found substantial content
    if (line.length > 20 || /^#{1,6}\s+/.test(line) || /^[-*]\s+/.test(line)) {
      startLine = i;
      break;
    }
  }

  // Find end before "rationale" or similar sections
  let endLine = lines.length;
  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{1,6}\s*(rationale|explanation|notes|why)\b/i.test(line)) {
      endLine = i;
      break;
    }
  }

  let content = lines.slice(startLine, endLine).join('\n').trim();
  
  // Remove code fences if present
  content = content.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```\s*$/, '').trim();
  
  // If still nothing substantial, just return cleaned raw text
  if (content.length < 20) {
    content = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```\s*$/, '').trim();
  }

  return { title: extractTitleFromContent(content), content };
}
