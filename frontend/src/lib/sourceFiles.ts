import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────────────────────────────────
// Storage helpers — public URLs for downloadable source files
// ──────────────────────────────────────────────────────────────────────────

export const SOURCE_FILES_BUCKET = "source-files";

export function getSourceFileUrl(filename: string): string {
  const { data } = supabase.storage
    .from(SOURCE_FILES_BUCKET)
    .getPublicUrl(filename);
  return data.publicUrl;
}

// ──────────────────────────────────────────────────────────────────────────
// GitHub proxy — talks to the github-proxy edge function
// ──────────────────────────────────────────────────────────────────────────

export interface GhRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string;
  updated_at: string;
  size: number;
  license: { name: string; spdx_id: string } | null;
}

export interface GhTreeNode {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
}

export interface GhTree {
  sha: string;
  url: string;
  tree: GhTreeNode[];
  truncated: boolean;
}

export interface GhCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
  };
  author: { login: string; avatar_url: string; html_url: string } | null;
}

type ProxyAction =
  | { action: "repo"; owner: string; repo: string }
  | { action: "tree"; owner: string; repo: string; branch?: string; recursive?: boolean }
  | { action: "contents"; owner: string; repo: string; path: string; ref?: string }
  | { action: "commits"; owner: string; repo: string; perPage?: number }
  | { action: "languages"; owner: string; repo: string }
  | { action: "readme"; owner: string; repo: string };

async function callProxy<T>(payload: ProxyAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke("github-proxy", {
    body: payload,
  });
  if (error) throw new Error(error.message || "github-proxy invocation failed");
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

export const githubApi = {
  repo: (owner: string, repo: string) =>
    callProxy<GhRepo>({ action: "repo", owner, repo }),

  tree: (owner: string, repo: string, branch = "main") =>
    callProxy<GhTree>({ action: "tree", owner, repo, branch, recursive: true }),

  /** Returns the raw file contents as a string. Binary files will be unreadable. */
  contents: async (owner: string, repo: string, path: string, ref?: string) => {
    const data = await callProxy<{ content: string }>({
      action: "contents",
      owner,
      repo,
      path,
      ref,
    });
    return data.content;
  },

  commits: (owner: string, repo: string, perPage = 10) =>
    callProxy<GhCommit[]>({ action: "commits", owner, repo, perPage }),

  languages: (owner: string, repo: string) =>
    callProxy<Record<string, number>>({ action: "languages", owner, repo }),

  readme: async (owner: string, repo: string) => {
    const data = await callProxy<{ content: string }>({
      action: "readme",
      owner,
      repo,
    });
    return data.content;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// File-extension → Prism language mapping for syntax highlighting
// ──────────────────────────────────────────────────────────────────────────

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  css: "css",
  scss: "scss",
  html: "markup",
  xml: "markup",
  svg: "markup",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  sql: "sql",
  toml: "toml",
  ini: "ini",
  env: "bash",
  dockerfile: "docker",
};

export function languageFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith("dockerfile") || lower === "dockerfile") return "docker";
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  return EXT_TO_LANG[ext] || "plain";
}

export function isLikelyText(path: string): boolean {
  const lower = path.toLowerCase();
  const binaryExts = [
    "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff",
    "mp3", "mp4", "wav", "mov", "webm", "ogg",
    "pdf", "zip", "tar", "gz", "rar", "7z",
    "ttf", "otf", "woff", "woff2", "eot",
    "exe", "dll", "so", "bin", "wasm",
  ];
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  return !binaryExts.includes(ext);
}
