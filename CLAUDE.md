# Improvement WorkFlow

If I say "do improvement", do the following.

Read files under `improvement/*.md` order by file name as int.
And then do the task in the file.
Before starting task, create branch from current branch.
And `*.md` file which you did move the file to `improvement/done` directory.
At last commit changes to the branch.

If `improvement/*.md` are left, repeat this step.

When all tasks are finished, do "Update Document WorkFlow" written in the next section.

# Update Document WorkFlow

If I say "update docs", do the following.

Read "docs/.current-docs-sha" and get commit sha hash.
Check difference from it to latest, update document under docs and README\*.md.
After finishing document update, commit your changes and update "docs/.current-docs-sha" with latest commit sha hash and then commit "docs/.current-docs-sha" at last.
