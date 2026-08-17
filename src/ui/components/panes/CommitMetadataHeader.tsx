import type { ExtensionCommitMetadata } from "../../../core/types";
import { fitText } from "../../lib/text";
import type { AppTheme } from "../../themes";

interface CommitMetadataHeaderProps {
  commits: readonly ExtensionCommitMetadata[];
  theme: AppTheme;
  width: number;
}

/** Render Git commit headers preserved from a patch stream at the top of the review stream. */
export function CommitMetadataHeader({ commits, theme, width }: CommitMetadataHeaderProps) {
  const innerWidth = Math.max(1, width - 2);

  return (
    <box
      style={{
        width: "100%",
        flexDirection: "column",
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1,
        backgroundColor: theme.panel,
      }}
    >
      {commits.map((commit, index) => {
        const decorations = commit.decorations ? `(${commit.decorations})` : "";
        const decorationsWidth = decorations ? decorations.length + 1 : 0;
        const shaWidth = Math.max(1, innerWidth - "commit ".length - decorationsWidth);

        return (
          <box
            key={`commit-metadata:${commit.sha}:${index}`}
            style={{ width: "100%", flexDirection: "column" }}
          >
            {index > 0 ? <text fg={theme.muted}>{" ".repeat(innerWidth)}</text> : null}
            <text fg={theme.text}>
              <span fg={theme.muted}>commit </span>
              <span fg={theme.accent}>{fitText(commit.sha, shaWidth)}</span>
              {commit.decorations ? <span fg={theme.fileNew}> ({commit.decorations})</span> : null}
            </text>
            {commit.author ? (
              <text fg={theme.text}>{fitText(`Author: ${commit.author}`, innerWidth)}</text>
            ) : null}
            {commit.date ? (
              <text fg={theme.text}>{fitText(`Date:   ${commit.date}`, innerWidth)}</text>
            ) : null}
            {commit.subject ? (
              <text fg={theme.text}>{fitText(`    ${commit.subject}`, innerWidth)}</text>
            ) : null}
          </box>
        );
      })}
    </box>
  );
}
