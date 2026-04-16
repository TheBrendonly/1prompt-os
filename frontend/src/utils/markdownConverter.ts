/**
 * Converts HTML content to clean markdown while preserving structure and spacing
 */
export const htmlToMarkdown = (html: string): string => {
  // Remove any script/style tags and their content
  let markdown = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // Convert HTML headers to markdown headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  
  // Convert bold and italic formatting
  markdown = markdown.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');
  markdown = markdown.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*');
  
  // Convert lists - ordered lists
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
  });
  
  // Convert lists - unordered lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
  });
  
  // Convert paragraphs with proper spacing
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // Convert links
  markdown = markdown.replace(/<a[^>]*href=[\"']([^\"]*)[\"][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Handle blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    return content.split('\n').map(line => line.trim() ? `> ${line.trim()}` : '>').join('\n') + '\n\n';
  });
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '\"');
  markdown = markdown.replace(/&#39;/g, "'");
  
  // Clean up excessive whitespace while preserving intentional spacing
  // Remove extra spaces but keep double line breaks for section separation
  markdown = markdown.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  markdown = markdown.replace(/\n[ \t]+/g, '\n'); // Remove leading whitespace on lines
  markdown = markdown.replace(/[ \t]+\n/g, '\n'); // Remove trailing whitespace on lines
  
  // Ensure proper spacing between sections (double line breaks)
  markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Multiple line breaks to double
  
  // Ensure sections have proper spacing
  markdown = markdown.replace(/^(#{1,6}\s.*?)(\n)([^#\n])/gm, '$1\n\n$3');
  markdown = markdown.replace(/([^#\n])(\n)(#{1,6}\s)/gm, '$1\n\n$3');
  
  // Clean up list spacing
  markdown = markdown.replace(/(\n[-*+]\s.*?)(\n)([^-*+\n\s])/g, '$1\n\n$3');
  markdown = markdown.replace(/(\n\d+\.\s.*?)(\n)([^\d\n\s])/g, '$1\n\n$3');
  
  // Trim and ensure clean ending
  markdown = markdown.trim();
  
  return markdown;
};

/**
 * Preserves markdown formatting when content is already in markdown format
 */
export const preserveMarkdownFormatting = (content: string): string => {
  // If content appears to be HTML, convert it
  if (content.includes('<') && content.includes('>')) {
    return htmlToMarkdown(content);
  }
  
  // If already markdown, ensure proper spacing
  let markdown = content;
  
  // Ensure proper spacing between sections
  markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Multiple line breaks to double
  markdown = markdown.replace(/^(#{1,6}\s.*?)(\n)([^#\n])/gm, '$1\n\n$3');
  markdown = markdown.replace(/([^#\n])(\n)(#{1,6}\s)/gm, '$1\n\n$3');
  
  return markdown.trim();
};

/**
 * Ensures generated text strictly follows markdown heading syntax (#, ##, ###) and spacing
 */
export const ensureMarkdownStructure = (content: string): string => {
  let text = content || '';

  // If appears to be HTML, convert first
  if (text.includes('<') && text.includes('>')) {
    text = htmlToMarkdown(text);
  }

  // Normalize newlines
  text = text.replace(/\r\n/g, '\n');

  const lines = text.split('\n');

  // Ensure the first non-empty line is a H1 heading
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length === 0) continue;
    if (!/^#\s/.test(lines[i])) {
      lines[i] = `# ${lines[i].replace(/^#+\s*/, '').trim()}`;
    }
    break;
  }

  const MAIN_HEADINGS = [
    'ROLE DEFINITION',
    'PRIMARY OBJECTIVE',
    'KEY RESPONSIBILITIES',
    'KNOWLEDGE BASE',
    'COMMUNICATION PROTOCOLS',
    'OUTPUT FORMAT',
    'OPERATIONAL GUIDELINES',
    'COMMUNICATION STYLE',
    'SUCCESS CRITERIA',
    'CONSTRAINTS & LIMITATIONS',
    'CRITICAL REQUIREMENTS',
  ];

  const toTitleCase = (s: string) => s.toLowerCase().replace(/(^|[\s\-\&/])([a-z])/g, (_m, p1, p2) => `${p1}${p2.toUpperCase()}`);

  // Convert obvious all-caps headings to markdown H2
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // Skip already formatted headings or list items
    if (/^#{1,6}\s/.test(raw) || /^[-*+]\s/.test(raw) || /^\d+\.\s/.test(raw)) continue;

    const isAllCaps = /^[A-Z0-9][A-Z0-9 \-&/]{2,}$/.test(raw) && raw === raw.toUpperCase();
    if (isAllCaps || MAIN_HEADINGS.includes(raw)) {
      lines[i] = `## ${toTitleCase(raw)}`;
    }
  }

  // Replace numbered lists with bullets, as requested
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/^\s*\d+\.\s+/, '- ');
  }

  let out = lines.join('\n');

  // Ensure blank lines between H2 sections and after headings
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/^(##\s.*?)(\n)([^#\n])/gms, '$1\n\n$3');
  out = out.replace(/^(###\s.*?)(\n)([^#\n\-\*\d])/gms, '$1\n\n$3');

  // Final pass to preserve markdown formatting rules
  out = preserveMarkdownFormatting(out);
  return out;
};
