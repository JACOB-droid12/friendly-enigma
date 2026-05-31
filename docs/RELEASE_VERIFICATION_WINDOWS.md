# Windows Release Verification

Use these commands from the repository root on Windows. They avoid the broken
`py -3.13` launcher and use the verified Python 3.12.13 virtual environment.

```powershell
.\scripts\bootstrap-release-env.ps1
backend\.venv\Scripts\python.exe --version
backend\.venv\Scripts\python.exe -m pytest
backend\.venv\Scripts\python.exe -m ruff check .
```

The local Vercel build must be run from the path-safe `W:` subst drive created
by the bootstrap script. This avoids Vercel CLI's Windows local-build quoting
issue when the repository path contains a space.

```powershell
W:
npx vercel build --yes
```

Expected Python version:

```text
Python 3.12.13
```
