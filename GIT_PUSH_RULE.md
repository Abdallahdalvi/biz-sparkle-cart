# Git Push & Commits Rule for Antigravity AI

## 🚨 CRITICAL RULE FOR ALL FUTURE TURNS AND CONVERSATIONS

When the user requests to commit or push updates to GitHub in this project (e.g. for Watchtower deployment or Lovable syncing), **DO NOT** use the standard `git` command or `mingit`, as they are not in the PowerShell PATH or lack Windows Credential Manager configuration.

### ✅ Explicit Git Executable Path to Use

You **MUST ALWAYS** use the native Codex runtime Git executable located at:
```powershell
& "C:\Users\dalvi\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
```

### Example Usage in PowerShell `run_command`:
```powershell
& "C:\Users\dalvi\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" add . ; & "C:\Users\dalvi\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" commit -m "feat: your message here" ; & "C:\Users\dalvi\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" push
```

This guarantees that pushes succeed instantly and correctly sync with the remote repository `Abdallahdalvi/biz-sparkle-cart`.
