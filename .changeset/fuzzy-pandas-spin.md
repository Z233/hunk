---
"hunkdiff": patch
---

Fix `hunk pager` spinning at full CPU on colorful captured-host output such as LazyGit's `git log`, caused by a quadratic ANSI style-restore pass in terminal text sanitizing.
