# AGENTS.md - Survival Diary Web Frontend

AI coding agents should follow this document when working in this repository.

## Git branch ownership rule

- Jade Cohen / ligr00vefe@naver.com 작업자는 `kimin`으로 식별한다.
- 모든 작업 브랜치는 반드시 `{name}/{type}/{task}` 형식을 사용한다.
- kimin 작업 브랜치는 반드시 `kimin/{type}/{task}` 형식을 사용한다.
- 허용 예시: `kimin/feat/signup-page`, `kimin/fix/auth-route`, `kimin/chore/initial-frontend-snapshot`.
- `main`에는 절대 직접 커밋하거나 직접 push하지 않는다.
- 모든 변경 사항은 작업 브랜치에 push한 뒤 PR로만 `main`에 반영한다.
- 커밋 메시지는 Conventional Commits 형식을 사용한다. 예: `feat: add email signup page`.

## Project notes

- This repository is reserved for the Survival Diary web frontend.
- Keep frontend work separated from `SurvivalDiary_WebBackend` and `SurvivalDiary_App`.
- Do not commit generated build output, local editor settings, or secret files.
