# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-07-17

### Added

- `next.config.ts`에 `output: 'standalone'` 설정(Next.js 공식 Docker 배포 가이드 방식).
- `Dockerfile`: deps → build → runner 3단계 멀티스테이지. `.next/standalone` + `.next/static` + `public`만 최종 이미지에 포함, non-root(`node`) 유저로 실행.
- `docker-compose.yml`: prod 서비스, 호스트 포트는 `${PORT:-1337}`, 시크릿은 `.env`를 통해 런타임에만 주입(이미지 레이어에 굽지 않음).
- `.dockerignore` 추가 — 누락되어 있던 걸 뒤늦게 발견, 빌드 컨텍스트가 `node_modules`/`.git`/`craft`/`.env` 포함 754MB였던 걸 5KB로 줄임.
- `docker compose -f docker-compose.yml up -d --build` → `next build` → 컨테이너 기동 → `/home`, `/about` 200 응답까지 실측 검증. `/about`·`/projects`가 `force-dynamic`이라 빌드 타임에 Notion 토큰이 필요 없는 것도 확인.

## [0.2.0] - 2026-07-17

### Added

- `lib/notion.ts`: `@notionhq/client`(v5) 기반 Notion 데이터 조회 레이어.
  - `databases.retrieve`로 데이터소스 ID를 1회 조회해 캐시한 뒤 `dataSources.query`로 페이지를 조회(Notion API `2025-09-03`, `databases.query`는 더 이상 사용하지 않음).
  - `공개` 체크박스가 `true`인 페이지만 필터링해서 조회.
  - `구분`(Work/Education/Prize/Project)별로 그룹핑하는 `getGroupedPortfolio()` 헬퍼 제공.
  - `카테고리`(다중 선택) 값을 태그 배열로 그대로 노출.
  - Notion SDK 호출은 `fetch`가 아니라 Next.js의 fetch 캐시 대상이 아니므로 `unstable_cache`로 감싸 `NOTION_REVALIDATE_SECONDS`(기본 300초) 주기로 재검증.
- `.env.example`에 `NOTION_TOKEN`/`NOTION_DATABASE_ID`/`NOTION_REVALIDATE_SECONDS` 정리.
- `tsconfig.json`에 `@/lib/*` → 루트 `lib/*` 경로 별칭 추가.

## [0.1.0] - 2026-07-17

### Added

- `Akshayp2002/next-portfolio-new`(Next.js 16.1.6, App Router) 템플릿을 이식.
- `AGENTS.md`에 버전 관리/커밋/Docker Compose/Notion 운영 규칙 정리.

### Removed

- `@vercel/analytics` — Vercel 전용 기능이라 self-host 환경에서 동작하지 않아 제거.
- Contentful 기반 블로그 섹션(`/blog`, `/api/blogs`) — Notion 단일 DB 콘텐츠 모델과 무관한 별도 외부 CMS라 제거.
- Supabase 기반 리뷰/추천사 섹션(`/testimonies`, `/api/reviews`) — 마찬가지로 Notion 계획 밖의 별도 백엔드라 제거.
- Tools 섹션 — 개인 이력이 아닌 범용 기술/도구 소개 정적 목록이라 제거.
- 원저자(Akshay) 개인정보/이력 — 이름·소개문구, Instagram/LinkedIn/GitHub 링크, 지도 좌표(Kerala→Gwangju로 교체), `careers.ts`/`projects.ts`의 실제 경력·프로젝트 데이터(빈 배열로 초기화, 콘텐츠는 2단계에서 Notion으로 채움).

### Content

- Craft(craft.me) 포트폴리오 내보내기(`./craft`)를 분석해 Notion DB("포트폴리오", `39faac4e32a580aa9f7fd2fd2a197b85`)로 1차 이관.
  - 데이터소스 스키마 확장: `공개`(checkbox), `설명`(rich text), `기간`(rich text), `링크`(url), `이미지`(files) 속성 추가.
  - `카테고리`(다중 선택) 태그 20종 등록 (Work: 기술스택 9종 / Education: 학위·자격증·논문 3종 / Prize: 분야 4종 / Project: craft 원문 소분류 4종).
  - 총 48건 등록 및 `공개=true`로 설정 — Work 1, Education 13(학위 3·자격증 9·석사논문 1), Prize 6, Project 28(서비스및솔루션 8·쇼핑몰 3·홈페이지 9·개인프로젝트 8).
  - 등록 후 `구분`별 개수를 재조회하여 검증 완료(Work 1 / Education 13 / Prize 6 / Project 28, 전건 공개).
  - 이미지(`craft/*.assets` 94개)는 로컬 파일이라 Notion MCP 첨부 도구(공개 HTTPS URL만 지원)로 자동 업로드가 불가능하여 미첨부 — 각 페이지에 수동 첨부 필요.
