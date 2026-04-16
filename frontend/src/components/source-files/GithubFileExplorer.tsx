import { useEffect, useMemo, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  githubApi,
  languageFromPath,
  isLikelyText,
  type GhRepo,
  type GhTreeNode,
} from "@/lib/sourceFiles";
import { cn } from "@/lib/utils";

interface GithubFileExplorerProps {
  owner: string;
  repo: string;
  /** Default file shown when the explorer first loads. Defaults to README. */
  defaultPath?: string;
  /** Tailwind class applied to the explorer wrapper (controls height). */
  heightClassName?: string;
}

interface TreeFolder {
  type: "folder";
  name: string;
  path: string;
  children: TreeNode[];
}
interface TreeFile {
  type: "file";
  name: string;
  path: string;
  size?: number;
}
type TreeNode = TreeFolder | TreeFile;

function buildTree(nodes: GhTreeNode[]): TreeFolder {
  const root: TreeFolder = { type: "folder", name: "", path: "", children: [] };
  for (const n of nodes) {
    if (n.type !== "blob" && n.type !== "tree") continue;
    const parts = n.path.split("/");
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");
      if (isLast && n.type === "blob") {
        cursor.children.push({ type: "file", name, path: fullPath, size: n.size });
      } else {
        let folder = cursor.children.find(
          (c) => c.type === "folder" && c.name === name,
        ) as TreeFolder | undefined;
        if (!folder) {
          folder = { type: "folder", name, path: fullPath, children: [] };
          cursor.children.push(folder);
        }
        cursor = folder;
      }
    }
  }
  // Sort: folders first, then files, both alphabetical
  const sortRec = (folder: TreeFolder) => {
    folder.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    folder.children.forEach((c) => c.type === "folder" && sortRec(c));
  };
  sortRec(root);
  return root;
}

function FolderRow({
  folder,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelectFile,
}: {
  folder: TreeFolder;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const isOpen = expanded.has(folder.path) || folder.path === "";
  return (
    <div>
      {folder.path !== "" && (
        <button
          type="button"
          onClick={() => onToggle(folder.path)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-90",
            )}
          />
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="field-text truncate" style={{ fontSize: "13px" }}>
            {folder.name}
          </span>
        </button>
      )}
      {isOpen &&
        folder.children.map((child) =>
          child.type === "folder" ? (
            <FolderRow
              key={child.path}
              folder={child}
              depth={folder.path === "" ? 0 : depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ) : (
            <button
              key={child.path}
              type="button"
              onClick={() => onSelectFile(child.path)}
              className={cn(
                "w-full flex items-center gap-1.5 px-2 py-1 text-left transition-colors",
                selectedPath === child.path
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50",
              )}
              style={{
                paddingLeft: `${(folder.path === "" ? 0 : depth + 1) * 12 + 22}px`,
              }}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="field-text truncate" style={{ fontSize: "13px" }}>
                {child.name}
              </span>
            </button>
          ),
        )}
    </div>
  );
}

function formatSize(n?: number): string {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}


export function GithubFileExplorer({
  owner,
  repo,
  defaultPath = "README.md",
  heightClassName = "h-[640px]",
}: GithubFileExplorerProps) {
  const [repoMeta, setRepoMeta] = useState<GhRepo | null>(null);
  const [tree, setTree] = useState<GhTreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPath, setSelectedPath] = useState<string | null>(defaultPath);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = await githubApi.repo(owner, repo);
        if (cancelled) return;
        setRepoMeta(meta);
        const treeData = await githubApi.tree(owner, repo, meta.default_branch);
        if (cancelled) return;
        setTree(treeData.tree);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load repo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  // Fetch file when selectedPath changes
  useEffect(() => {
    if (!selectedPath || !repoMeta) return;
    let cancelled = false;
    (async () => {
      setFileLoading(true);
      setFileError(null);
      try {
        if (!isLikelyText(selectedPath)) {
          setFileContent("");
          setFileError("Binary file — preview not available.");
          return;
        }
        const content = await githubApi.contents(
          owner,
          repo,
          selectedPath,
          repoMeta.default_branch,
        );
        if (cancelled) return;
        setFileContent(content);
      } catch (e: unknown) {
        if (cancelled) return;
        setFileError(e instanceof Error ? e.message : "Failed to load file");
      } finally {
        if (!cancelled) setFileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPath, owner, repo, repoMeta]);

  const rootFolder = useMemo(() => (tree ? buildTree(tree) : null), [tree]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const breadcrumbs = selectedPath ? selectedPath.split("/") : [];
  const isMarkdown = selectedPath?.toLowerCase().endsWith(".md");
  const lang = selectedPath ? languageFromPath(selectedPath) : "plain";

  if (loading) {
    return (
      <div className={cn("groove-border flex items-center justify-center", heightClassName)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="field-text" style={{ fontSize: "13px" }}>
            Loading repository…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("groove-border flex items-center justify-center p-6", heightClassName)}>
        <div className="text-center space-y-2">
          <p className="field-text text-destructive">Failed to load repository</p>
          <p className="field-text text-muted-foreground" style={{ fontSize: "13px" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Repo header bar — repo name + Open on GitHub button (matches Download button style) */}
      {repoMeta && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <a
            href={repoMeta.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="field-text font-medium hover:underline truncate"
            style={{ fontSize: "14px" }}
          >
            {repoMeta.full_name}
          </a>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-medium shrink-0"
          >
            <a href={repoMeta.html_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open on GitHub
            </a>
          </Button>
        </div>
      )}

      {/* Explorer body */}
      <div className={cn("groove-border flex overflow-hidden", heightClassName)}>
        {/* Sidebar / tree */}
        <div className="w-64 shrink-0 border-r border-dashed border-border overflow-y-auto bg-muted/20">
          <div className="px-3 py-2 border-b border-dashed border-border bg-muted/30">
            <span
              className="field-text uppercase tracking-wider text-muted-foreground"
              style={{ fontSize: "13px" }}
            >
              Explorer
            </span>
          </div>
          {rootFolder && (
            <FolderRow
              folder={rootFolder}
              depth={-1}
              expanded={expanded}
              onToggle={toggle}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
            />
          )}
        </div>

        {/* Main pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Breadcrumbs */}
          <div className="px-4 py-2 border-b border-dashed border-border bg-muted/20 flex items-center gap-1 overflow-x-auto">
            {breadcrumbs.length === 0 ? (
              <span className="field-text text-muted-foreground" style={{ fontSize: "13px" }}>
                Select a file to preview
              </span>
            ) : (
              breadcrumbs.map((part, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "field-text",
                      i === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground",
                    )}
                    style={{ fontSize: "13px" }}
                  >
                    {part}
                  </span>
                </span>
              ))
            )}
            {selectedPath && repoMeta && (
              <a
                href={`${repoMeta.html_url}/blob/${repoMeta.default_branch}/${selectedPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto field-text text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                style={{ fontSize: "13px" }}
              >
                <ExternalLink className="h-3 w-3" />
                Raw
              </a>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {fileLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : fileError ? (
              <div className="h-full flex items-center justify-center p-6">
                <p className="field-text text-muted-foreground" style={{ fontSize: "13px" }}>
                  {fileError}
                </p>
              </div>
            ) : isMarkdown ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert p-6"
                style={{ fontSize: "13px" }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
              </div>
            ) : (
              <Highlight code={fileContent} language={lang as never} theme={themes.vsDark}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={cn(className, "leading-relaxed p-4 m-0 overflow-x-auto")}
                    style={{ ...style, background: "transparent", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}
                  >
                    {tokens.map((line, i) => {
                      const lineProps = getLineProps({ line });
                      return (
                        <div key={i} {...lineProps} className={cn(lineProps.className, "table-row")}>
                          <span
                            className="table-cell pr-4 text-right select-none text-muted-foreground/60"
                            style={{ width: "1%", whiteSpace: "nowrap" }}
                          >
                            {i + 1}
                          </span>
                          <span className="table-cell">
                            {line.map((token, key) => {
                              const tokenProps = getTokenProps({ token });
                              return <span key={key} {...tokenProps} />;
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </pre>
                )}
              </Highlight>
            )}
          </div>

          {/* Status bar */}
          {selectedPath && (
            <div className="px-4 py-1.5 border-t border-dashed border-border bg-muted/20 flex items-center justify-between field-text text-muted-foreground" style={{ fontSize: "13px" }}>
              <span>{lang === "plain" ? "Plain text" : lang}</span>
              <span>
                {tree?.find((n) => n.path === selectedPath)?.size !== undefined
                  ? formatSize(tree?.find((n) => n.path === selectedPath)?.size)
                  : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
