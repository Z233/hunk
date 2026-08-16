import type { ExtensionCommitMetadata } from "../types";

export interface GitLogMetadata {
  text: string;
  commits: ExtensionCommitMetadata[];
}

/**
 * Extract `git log -p` / `git show -p` commit metadata and return a plain patch stream.
 *
 * Each commit in `git log -p` looks like:
 *
 * ```
 * commit <sha>[ (refs)]
 * Author: ...
 * Date:   ...
 *
 *     <commit message>
 *
 * diff --git a/foo b/foo
 * ...
 * ```
 *
 * Lines from `commit ` through the first patch header (`diff --git `,
 * `--- `, or `+++ `) are dropped. Hunk-body lines always start with
 * `+`, `-`, ` ` or `\`, so a real context line that begins with the word
 * "commit" is unaffected (its leading space prevents the regex match).
 *
 * Returns the input unchanged when no `commit <sha>` boundary is present,
 * keeping the regular patch path zero-cost.
 */
export function extractGitLogMetadata(text: string): GitLogMetadata {
  // Hex range up to 64 covers both SHA-1 (40) and SHA-256 (64) repos.
  const COMMIT_BOUNDARY = /^commit [0-9a-f]{4,64}(?: |$)/m;
  if (!COMMIT_BOUNDARY.test(text)) {
    return { text, commits: [] };
  }

  const lines = text.split("\n");
  const out: string[] = [];
  const commits: ExtensionCommitMetadata[] = [];
  let activeCommit: ExtensionCommitMetadata | null = null;
  let inHeader = false;

  for (const line of lines) {
    const commitMatch = /^commit ([0-9a-f]{4,64})(?: \((.*)\))?/.exec(line);
    if (commitMatch) {
      activeCommit = { sha: commitMatch[1] ?? "" };
      if (commitMatch[2]) {
        activeCommit.decorations = commitMatch[2];
      }
      inHeader = true;
      continue;
    }
    if (inHeader) {
      // The header section ends at the first patch line. `diff --git `
      // is the canonical Git start; `--- `/`+++ ` cover unified-diff
      // input where someone synthesised log output without it.
      if (line.startsWith("diff --git ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
        inHeader = false;
        if (activeCommit) {
          commits.push(activeCommit);
        }
        activeCommit = null;
        out.push(line);
      } else if (activeCommit) {
        if (line.startsWith("Author:")) {
          activeCommit.author = line.slice("Author:".length).trim();
        } else if (line.startsWith("Date:")) {
          activeCommit.date = line.slice("Date:".length).trim();
        } else if (line.startsWith("    ") && !activeCommit.subject) {
          const subject = line.slice(4).trim();
          if (subject) {
            activeCommit.subject = subject;
          }
        }
      }
      continue;
    }
    out.push(line);
  }

  return { text: out.join("\n"), commits };
}

/** Strip Git commit metadata while keeping the historical text-only helper contract. */
export function stripGitLogMetadata(text: string) {
  return extractGitLogMetadata(text).text;
}
